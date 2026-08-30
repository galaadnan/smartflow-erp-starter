import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../../../generated/prisma/enums';

export const PERMISSION_KEY = 'required_permissions';

export const RequirePermission = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
