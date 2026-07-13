import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MetadataKeys } from 'libs/constant';
import { getProcessId } from 'libs/utils/string.until';

export const ProcessId = createParamDecorator((ctx: ExecutionContext) => {
  if (ctx.getType() === 'rpc') {
    const rpcData = ctx.switchToRpc().getData();
    return rpcData?.processId || rpcData?.data?.processId;
  }
  if (ctx.getType() === 'http') {
    const request = ctx.switchToHttp().getRequest();
    return request[MetadataKeys.PROCESS_ID] || getProcessId();
  }
  return getProcessId();
});
