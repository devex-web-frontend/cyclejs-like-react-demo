import { createHashHistory, History, Location, UnregisterCallback } from 'history';
import { Disposable, Scheduler, Sink, Stream } from '@most/types';

export class HistoryEventSource<A> implements Stream<Location<A>> {
	constructor(private readonly history: History) {}

	run(sink: Sink<Location<A>>, scheduler: Scheduler): Disposable {
		const teardown = this.history.listen(location => sink.event(scheduler.currentTime(), location));
		sink.event(scheduler.currentTime(), this.history.location);
		return {
			dispose() {
				teardown();
			},
		};
	}
}
