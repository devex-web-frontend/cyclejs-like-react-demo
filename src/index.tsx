import { render } from 'react-dom';
import { createElement } from 'react';
import { AppContainer } from './ui/app/containers/app.container';
import { createHashHistory } from 'history';

render(
	createElement(AppContainer.run({ storage: localStorage, history: createHashHistory() })),
	document.getElementById('root'),
);
