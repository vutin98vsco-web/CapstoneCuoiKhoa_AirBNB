import { reportServerError } from './lib/observability';
export function onRequestError(error) { reportServerError('request.uncaught', error); }
