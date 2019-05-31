import { toReactComponent } from './utils';
import { TaskList } from './ui/task-list/components/task-list/task-list.component';
import { newDefaultScheduler } from '@most/scheduler';
import { render } from 'react-dom';
import * as React from 'react';

const scheduler = newDefaultScheduler();
const ReactApp = toReactComponent(TaskList);
render(<ReactApp scheduler={scheduler} />, document.getElementById('root'));
