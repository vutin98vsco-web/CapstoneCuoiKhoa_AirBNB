import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes,randomUUID } from 'node:crypto';
import pg from 'pg';
import { openPostgresStore } from '../lib/database/postgres.server.js';
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
async function fixture(fn){
  assert(url,'Set DATABASE_URL to run PostgreSQL integration tests.');
  const schema=`tnbnb_test_${randomBytes(8).toString('hex')}`,db=openPostgresStore(url,{schema});
  const create=name=>db.accounts.register({email:`${name}@example.test`,name,phone:'',passwordHash:'fixture-hash',recoveryHash:'fixture-recovery'});
  try{await fn(db,create,schema);}finally{
    await db.close();const connection=new URL(url);connection.searchParams.set('sslmode','verify-full');
    const pool=new pg.Pool({connectionString:connection.toString(),max:1});
    try{await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);}finally{await pool.end();}
  }
}
const trip={propertyId:'hotel',roomTypeId:'grade',checkin:'2027-01-01',checkout:'2027-01-02',rooms:1,guests:1,fullName:'Synthetic Guest',email:'guest@example.test',phone:'+84901234567',message:''};
test('PostgreSQL concurrent requests are idempotent and cannot cross owners',()=>fixture(async(db,create)=>{
  const key=randomUUID(),owner=randomBytes(32).toString('hex');
  const results=await Promise.all(Array.from({length:6},()=>db.create(owner,key,trip,{propertyName:'Original'})));
  assert.equal(new Set(results.map(r=>r.booking.id)).size,1);assert.equal(results.filter(r=>!r.replay).length,1);
  assert.equal((await db.create(owner,randomUUID(),trip,{})).error,'duplicate');
  assert.equal((await db.create(owner,key,{...trip,message:'changed'},{})).error,'request_changed');
  const id=results[0].booking.id;assert.equal(await db.get('other-owner',id),null);assert.equal(await db.cancel('other-owner',id),null);
  const user=await create('ClaimOwner');await db.accounts.createSession(user.id,'session',Date.now()+60000,owner);
  assert.equal((await db.list(`account:${user.id}`))[0].id,id);
  await db.cancel(`account:${user.id}`,id);assert.equal((await db.get(owner,id)).status,'cancelled');
}));
test('PostgreSQL sessions, avatars and recovery changes persist and remain isolated',()=>fixture(async(db,create)=>{
  const a=await create('AccountA'),b=await create('AccountB');await db.accounts.createSession(a.id,'token',Date.now()+60000);
  assert.equal((await db.accounts.session('token')).id,a.id);await db.accounts.saveFavorite(a.id,'hotel',true);
  assert.deepEqual(await db.accounts.favorites(b.id),[]);assert.deepEqual(await db.accounts.favorites(a.id),['hotel']);
  const bytes=Buffer.from([1,2,3]);await db.accounts.setAvatar(a.id,bytes);assert.deepEqual(await db.accounts.avatar(a.id),bytes);
  assert.equal((await db.accounts.publicById(a.id)).hasAvatar,true);await db.accounts.removeAvatar(a.id);assert.equal(await db.accounts.avatar(a.id),null);
  const changed=await Promise.all([db.accounts.updatePassword(a.id,'new-hash','new-recovery','fixture-recovery'),db.accounts.updatePassword(a.id,'second-hash','second-recovery','fixture-recovery')]);
  assert.deepEqual(changed.sort(),[false,true]);assert.equal(await db.accounts.session('token'),null);
  await Promise.all(Array.from({length:8},()=>db.accounts.failure('login',a.email)));assert.equal(await db.accounts.allowed('login',a.email),false);
  await db.accounts.clearFailures('login',a.email);assert.equal(await db.accounts.allowed('login',a.email),true);
}));
test('PostgreSQL review moderation and catalog edits preserve public aggregates and snapshots',()=>fixture(async(db,create)=>{
  const a=await create('ReviewerA'),b=await create('ReviewerB');await db.workspace.bootstrapRole(a.id,'admin');
  const first=await db.workspace.saveReview(a.id,'hotel',{rating:5,body:'A helpful sourced review'});await db.workspace.saveReview(b.id,'hotel',{rating:3,body:'Another helpful review'});
  assert.equal((await db.workspace.reviewList('hotel')).summary.average,4);
  await db.workspace.moderate(a.id,first.id,'hidden','Synthetic moderation');assert.equal((await db.workspace.reviewList('hotel')).count,1);
  await db.workspace.saveReview(a.id,'hotel',{rating:4,body:'Edited while still hidden'},true);assert.equal((await db.workspace.ownReview(a.id,'hotel')).status,'hidden');
  await db.workspace.moderate(a.id,first.id,'published','');assert.equal((await db.workspace.reviewList('hotel')).summary.average,3.5);
  assert.equal((await db.workspace.reviewList('hotel')).items[0].email,undefined);
  await db.workspace.saveCity(a.id,{id:'test-city',name:{vi:'Thử nghiệm',en:'Test City'}});await db.workspace.saveProperty(a.id,{id:'hotel',tenPhong:'Hidden hotel'},true);
  assert.equal((await db.workspace.propertyOverrides())[0].archived,true);assert.equal((await db.workspace.cityOverrides())[0].data.name.en,'Test City');
  const result=await db.create('owner',randomUUID(),trip,{propertyName:'Original'});await db.workspace.manageBooking(a.id,result.booking.id,{stage:'contacted',note:'Private',cancel:false});
  assert.equal((await db.get('owner',result.booking.id)).snapshot.propertyName,'Original');assert.equal((await db.get('owner',result.booking.id)).note,undefined);
  assert.equal((await db.workspace.bookings('synthetic')).count,1);assert.equal((await db.workspace.moderation('%')).count,0);assert.equal((await db.workspace.users('reviewer')).count,2);
  assert.ok((await db.workspace.audit()).count>=4);await db.workspace.deleteReview(a.id,'hotel');assert.equal(await db.workspace.ownReview(a.id,'hotel'),null);
}));
test('PostgreSQL concurrent role changes keep one active admin and revoke sessions',()=>fixture(async(db,create)=>{
  const a=await create('AdminA'),b=await create('AdminB'),c=await create('Member');await db.workspace.bootstrapRole(a.id,'admin');await db.workspace.bootstrapRole(b.id,'admin');
  await db.accounts.createSession(c.id,'member-session',Date.now()+60000);await db.workspace.manageUser(a.id,c.id,'user',true);assert.equal(await db.accounts.session('member-session'),null);
  await assert.rejects(db.workspace.manageUser(a.id,a.id,'user',false),/self_change/);
  const results=await Promise.allSettled([db.workspace.bootstrapRole(a.id,'user'),db.workspace.bootstrapRole(b.id,'user')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/last_admin/);
  const admins=(await db.workspace.users()).items.filter(u=>u.role==='admin'&&!u.disabled);assert.equal(admins.length,1);
}));
