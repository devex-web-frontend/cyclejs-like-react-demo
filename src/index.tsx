import { TaskList } from './ui/task-list/components/task-list/task-list.component';
import { render } from 'react-dom';
import * as React from 'react';
import { createHashHistory, History, Location, UnregisterCallback } from 'history';
import { memo } from 'react';
import { useState } from 'react';
import { ReactElement } from 'react';
import { useEffect } from 'react';
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

const history = createHashHistory();
const location = xs.createWithMemory(new HistoryProducer(history));

const taskList = TaskList({ location });
const Wrapper = memo(() => {
	const [state, setState] = useState<ReactElement>();
	useEffect(() => {
		const subscription = xs.merge(taskList.vdom.map(setState), taskList.effect).subscribe({});
		return () => subscription.unsubscribe();
	}, []);
	return state || null;
});

render(<Wrapper />, document.getElementById('root'));
