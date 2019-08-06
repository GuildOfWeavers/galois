import { workerData, parentPort } from 'worker_threads';

console.log('in worker!');

parentPort!.postMessage('hello: ' + workerData);

parentPort!.on('message', (message) => {
    parentPort!.postMessage('pong: ' + message);
});