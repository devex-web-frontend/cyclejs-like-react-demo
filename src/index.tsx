import { toReactComponent } from './utils';
import { TaskList } from './ui/task-list/components/task-list/task-list.component';
import { render } from 'react-dom';
import * as React from 'react';

const ReactApp = toReactComponent(TaskList);
render(<ReactApp />, document.getElementById('root'));
