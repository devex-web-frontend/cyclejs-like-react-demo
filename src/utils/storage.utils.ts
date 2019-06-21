import { Disposable, Scheduler, Sink, Stream } from '@most/types';

export class StorageEventSource implements Stream<StorageEvent> {
	run(sink: Sink<StorageEvent>, scheduler: Scheduler): Disposable {
		const handler = (e: StorageEvent) => sink.event(scheduler.currentTime(), e);
		window.addEventListener('storage', handler);
		return {
			dispose() {
				window.removeEventListener('storage', handler);
			},
		};
	}
}
