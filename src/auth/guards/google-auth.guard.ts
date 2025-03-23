import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const role = request.query.role || 'Participant';

    return {
      state: Buffer.from(JSON.stringify({ role })).toString('base64'),
      scope: ['email', 'profile'],
    };
  }
}
