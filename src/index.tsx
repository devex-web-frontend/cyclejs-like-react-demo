import { render } from 'react-dom';
import * as React from 'react';
import { createElement } from 'react';
import { AppContainer } from './ui/app/containers/app.container';

render(createElement(AppContainer.run({ foo: '123' })), document.getElementById('root'));
