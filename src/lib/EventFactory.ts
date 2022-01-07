import {EventEmitter} from 'events';

export default function createEmitter() {
    return new EventEmitter();
}
