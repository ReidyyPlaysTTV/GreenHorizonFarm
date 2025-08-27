// This file serves as a central hub for re-exporting all server actions.
// By doing this, we can ensure that client components only import from this file,
// providing a clear boundary between server and client code.

'use server';

export * from './actions/personnel-actions';
export * from './actions/form-actions';
