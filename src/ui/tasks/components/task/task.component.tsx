import { K, Streamify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils/utils';
import * as React from 'react';
import cx from 'classnames';
import { ChangeEvent, createRef, FocusEvent, MouseEvent } from 'react';
import { compose, constant, constVoid } from 'fp-ts/lib/function';
import { setCompleted, setEditing, setTitle, TaskValue } from '../../model/task.model';
import { filter, map, merge, snapshot } from '@most/core';
import { pipe } from 'fp-ts/lib/pipeable';

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

	const title = merge(K(handleEditChange, e => e.target.value), K(props.value, value => value.title));

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

	const destroy = pipe(
		handleDestroyClick,
		map(constVoid),
	);
	const enterKeyUp = pipe(
		handleEditKeyUp,
		filter(e => e.keyCode === ENTER_KEY),
	);

	const value = reduce(
		props.value,
		pipe(
			handleTitleDoubleClick,
			map(constant(setEditing(true))),
		),
		pipe(
			handleEditKeyUp,
			filter(e => e.keyCode === ESC_KEY),
			map(constant(setEditing(true))),
		),
		pipe(
			handleToggleChange,
			map(e => e.target.checked),
			map(setCompleted),
		),
		pipe(
			merge(enterKeyUp, handleEditBlur),
			snapshot(
				(title, _) =>
					compose(
						setEditing(false),
						setTitle(title),
					),
				title,
			),
		),
	);

	return { vdom, value, destroy };
};
