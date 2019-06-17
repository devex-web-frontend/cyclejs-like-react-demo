import { render } from 'react-dom';
import { createElement } from 'react';
import { AppContainer } from './ui/app/containers/app.container';

render(createElement(AppContainer.run({ storage: localStorage, window })), document.getElementById('root'));
