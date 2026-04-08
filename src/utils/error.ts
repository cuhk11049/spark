const errorMessages: Record<number, string> = {
  40001: '缺少必要参数，请检查输入内容',
  40002: '参数格式不正确，请重新确认',
  40101: '未找到用户，请检查 X-User-Id 是否正确',
  40301: '该会话由于违规已被系统屏蔽，无法接管',
  40302: '您已经接管了该会话',
  40303: '对方暂未开启小助手',
  40401: '会话不存在，请刷新列表后重试',
  50001: 'AI 思考超时，请重试',
};

export function getErrorMessage(code: number, fallback: string) {
  return errorMessages[code] ?? fallback;
}
