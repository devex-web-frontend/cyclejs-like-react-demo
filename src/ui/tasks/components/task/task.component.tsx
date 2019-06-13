import { K, Streamify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils/utils';
import * as React from 'react';
import cx from 'classnames';
import { ChangeEvent, createRef, FocusEvent, MouseEvent } from 'react';
import { constVoid } from 'fp-ts/lib/function';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sampleCombine from 'xstream/extra/sampleCombine';
import { setCompleted, setEditing, setTitle, TaskValue } from '../../model/task.model';

const ESC_KEY = 27;
const ENTER_KEY = 13;

type Props = {
	value: TaskValue;
};

export const Task = (props: Streamify<Props>) => {
	const editInputRef = createRef<HTMLInputElement>();
	const handleDestroyClick = createHandler<MouseEvent<HTMLButtonElement>>();
	const handleToggleChange = createHandler<ChangeEvent<HTMLInputElement>>();
	const handleTitleDoubleClick = createHandler<MouseEvent<HTMLLabelElement>>();
	const handleEditKeyUp = createHandler<TargetKeyboardEvent<HTMLInputElement>>();
	const handleEditBlur = createHandler<FocusEvent<HTMLInputElement>>();
	const handleEditChange = createHandler<ChangeEvent<HTMLInputElement>>();

	const title = xs.merge(K(handleEditChange, e => e.target.value), K(props.value, value => value.title));

	const vdom = K(props.value, title, ({ completed, editing }, title) => {
		const todoRootClassName = cx('todoRoot', {
			completed,
			editing,
		});

		return (
			<li className={todoRootClassName}>
				<div className={'view'}>
					<input type="checkbox" className={'toggle'} checked={completed} onChange={handleToggleChange} />
					<label onDoubleClick={handleTitleDoubleClick}>{title}</label>
					<button className={'destroy'} onClick={handleDestroyClick} />
				</div>
				<input
					value={title}
					onChange={handleEditChange}
					autoFocus={editing}
					type="text"
					className={'edit'}
					ref={editInputRef}
					onKeyUp={handleEditKeyUp}
					onBlurCapture={handleEditBlur}
				/>
			</li>
		);
	});

	const destroy = handleDestroyClick.map(constVoid);
	const enterKeyUp = handleEditKeyUp.filter(e => e.keyCode === ENTER_KEY);

	const value = reduce(
		props.value,
		handleTitleDoubleClick.mapTo(setEditing(true)),
		handleEditKeyUp.filter(e => e.keyCode === ESC_KEY).mapTo(setEditing(true)),
		handleToggleChange.map(e => e.target.checked).map(setCompleted),
		xs.merge(enterKeyUp, handleEditBlur).mapTo(setEditing(false)),
		xs
			.merge(enterKeyUp, handleEditBlur)
			.compose(sampleCombine(title))
			.map(([_, title]) => setTitle(title)),
	);

	return { vdom, value, destroy };
};
