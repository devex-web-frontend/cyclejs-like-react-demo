import { createHashHistory } from 'history';
import { combineReader, deferReader } from '@devexperts/utils/dist/adt/reader.utils';
import { App } from '../components/app/app.component';
import { fromHistory } from '../../../utils/utils';

export const AppContainer = combineReader(deferReader(App, 'location'), App =>
	App.run({ location: fromHistory(createHashHistory()) }),
);
