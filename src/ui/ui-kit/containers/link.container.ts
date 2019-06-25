import { ask } from 'fp-ts/lib/Reader';
import { Link } from '../components/link/link.component';
import { First, K } from '../../../utils/utils';
import { combineReader } from '@devexperts/utils/dist/adt/reader.utils';
import { Omit } from 'typelevel-ts';
import { Location } from 'history';
import { Stream } from '@most/types';

type LinkContainerContext = {
	location: Stream<Location>;
};

type Props = Omit<First<Parameters<typeof Link>>, 'isActive'>;

export const LinkContainer = combineReader(ask<LinkContainerContext>(), ({ location }) => (props: Props) =>
	Link({
		...props,
		isActive: K(props.path, location, (path, location) => path === location.pathname),
	}),
);
