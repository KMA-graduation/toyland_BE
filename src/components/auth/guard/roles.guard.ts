import { ROLES_KEY } from '@decorators/roles.decorator';
import { ResponseCodeEnum } from '@enums/response-code.enum';
import { ResponseMessageEnum } from '@enums/response-message.enum';
import { RoleEnum } from '@enums/role.enum';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiError } from '@utils/api.error';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const isValidRole = requiredRoles.some((role) =>
      [user.role].includes(role),
    );

    if (!isValidRole) {
      throw new ApiError(
        ResponseCodeEnum.FORBIDDEN,
        ResponseMessageEnum.FORBIDDEN,
      ).toResponse();
    }

    return true;
  }
}
