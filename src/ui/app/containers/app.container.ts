import { combineReader, deferReader } from '@devexperts/utils/dist/adt/reader.utils';
import { App } from '../components/app/app.component';
import { historyService } from '../../../services/history.service';

export const AppContainer = combineReader(deferReader(App, 'location'), historyService, (App, historyService) =>
	App.run({ location: historyService.location }),
);
