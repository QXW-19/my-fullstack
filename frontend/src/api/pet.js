import request from '@/utils/request';


/**
 * 领养宠物
 */
export const adoptPet = (data) =>
    request.post('/pet/adopt', data);


/**
 * 获取宠物
 */
export const getPet = () =>
    request.get('/pet');


/**
 * 执行宠物行为
 */
export const doAction = (action) =>
    request.post(
        '/pet/action',
        { action }
    );


/**
 * 获取行为历史
 */
export const getActions = () =>
    request.get('/pet/actions');


/**
 * 改名
 */
export const renamePet = (name) =>
    request.post(
        '/pet/rename',
        { name }
    );


/**
 * 复活
 */
export const revivePet = () =>
    request.post('/pet/revive');


/**
 * 领取每日任务奖励
 */
export const claimDailyTask = (
    taskId
) =>
    request.post(
        '/pet/daily-task/claim',
        { taskId }
    );

export const getAchievements = () => request.get('/pet/achievements');

export const getTombstone = () => request.get('/pet/tombstone');
