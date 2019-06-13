import { createHashHistory, History, Location, UnregisterCallback } from 'history';
import { combineReader, deferReader } from '@devexperts/utils/dist/adt/reader.utils';
import { App } from '../components/app/app.component';
import xs, { Listener, Producer } from 'xstream';

class HistoryProducer implements Producer<Location> {
	private teardown?: UnregisterCallback;
	constructor(private readonly history: History) {}

	start(listener: Listener<Location>): void {
		this.teardown = this.history.listen(location => listener.next(location));
		listener.next(this.history.location);
	}
	stop() {
		this.teardown && this.teardown();
	}
}

export const AppContainer = combineReader(deferReader(App, 'location'), App =>
	App.run({ location: xs.createWithMemory(new HistoryProducer(createHashHistory())) }),
);
