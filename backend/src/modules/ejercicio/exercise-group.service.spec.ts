import { ForbiddenException } from '@nestjs/common';
import { ExerciseGroupService } from './exercise-group.service';

describe('ExerciseGroupService domain rules', () => {
  const service = new ExerciseGroupService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  it('normalizes names case-insensitively and without accents', () => {
    expect((service as any).normalizeName('  Álfa   TEAM ')).toBe('alfa team');
  });

  it('blocks changes after groupsLockedAt', () => {
    expect(() =>
      (service as any).assertOpen({
        groupsLockedAt: new Date(Date.now() - 1000),
      }),
    ).toThrow(ForbiddenException);
  });

  it('blocks changes when the group is administratively locked', () => {
    expect(() =>
      (service as any).assertOpen({}, { modificationsLocked: true }),
    ).toThrow('Las modificaciones del grupo están bloqueadas');
  });

  it('allows changes before the deadline', () => {
    expect(() =>
      (service as any).assertOpen(
        { groupsLockedAt: new Date(Date.now() + 60000) },
        { modificationsLocked: false },
      ),
    ).not.toThrow();
  });
});
