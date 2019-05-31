import { toReactComponent } from './utils';
import { App } from './ui/task-list/components/task-list/task-list.component';
import { newDefaultScheduler } from '@most/scheduler';
import { render } from 'react-dom';
import * as React from 'react';

const scheduler = newDefaultScheduler();
const ReactApp = toReactComponent(App);
render(<ReactApp scheduler={scheduler} />, document.getElementById('root'));
