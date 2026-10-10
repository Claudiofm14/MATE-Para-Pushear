import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { USER_ROLES } from '../../auth/constants/roles.constant';
import { UsuarioService } from '../usuario/usuario.service';
import { ProfesorMateriaService } from '../usuario/profesor-materia.service';
import { ExerciseGroupService } from './exercise-group.service';
import { EjercicioService } from './ejercicio.service';

@Controller('ejercicio/:exerciseId/groups')
export class ExerciseGroupController {
  constructor(
    private groups: ExerciseGroupService,
    private users: UsuarioService,
    private exercises: EjercicioService,
    private professors: ProfesorMateriaService,
  ) {}
  private async actor(req: any) {
    return this.users.obtenerOCrearUsuario(req.user);
  }
  private async assertTeacher(req: any, exerciseId: number) {
    const actor = await this.actor(req);
    if (actor.rol === 'admin') return actor;
    const exercise = await this.exercises.findOne(exerciseId);
    if (
      !(await this.professors.verificarAccesoProfesor(
        actor.id,
        exercise.semana.cursada.materia.id,
      ))
    )
      throw new ForbiddenException('No tienes acceso docente a este ejercicio');
    return actor;
  }

  @Get()
  @Roles(USER_ROLES.ALUMNO, USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async list(@Request() req, @Param('exerciseId', ParseIntPipe) id: number) {
    const actor = await this.actor(req);
    if (actor.rol === 'alumno') return this.groups.list(id, actor.id);
    await this.assertTeacher(req, id);
    return this.groups.list(id);
  }
  @Get('mine')
  @Roles(USER_ROLES.ALUMNO)
  async mine(@Request() req, @Param('exerciseId', ParseIntPipe) id: number) {
    return this.groups.myGroup(id, (await this.actor(req)).id);
  }
  @Post()
  @Roles(USER_ROLES.ALUMNO)
  async create(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Body() body: { name: string },
  ) {
    return this.groups.create(id, await this.actor(req), body.name);
  }
  @Post(':groupId/join')
  @Roles(USER_ROLES.ALUMNO)
  async join(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    return this.groups.join(id, groupId, (await this.actor(req)).id);
  }
  @Delete('mine')
  @Roles(USER_ROLES.ALUMNO)
  async leave(@Request() req, @Param('exerciseId', ParseIntPipe) id: number) {
    return this.groups.leave(id, await this.actor(req));
  }
  @Post(':groupId/repository')
  @Roles(USER_ROLES.ALUMNO)
  async repo(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    const actor = await this.actor(req);
    const mine = await this.groups.myGroup(id, actor.id);
    if (!mine || mine.id !== groupId)
      throw new ForbiddenException('No perteneces al grupo');
    return this.groups.ensureRepository(id, groupId);
  }

  @Post('admin')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async adminCreate(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Body() body: { name: string; studentId: number },
  ) {
    await this.assertTeacher(req, id);
    return this.groups.create(
      id,
      await this.users.obtenerPorId(body.studentId),
      body.name,
      true,
    );
  }
  @Post(':groupId/members/:studentId')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async add(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    await this.assertTeacher(req, id);
    return this.groups.join(id, groupId, studentId);
  }
  @Delete(':groupId/members/:studentId')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async remove(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    await this.assertTeacher(req, id);
    return this.groups.removeMember(id, groupId, studentId);
  }
  @Post(':groupId/move/:studentId')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async move(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    await this.assertTeacher(req, id);
    return this.groups.moveMember(id, studentId, groupId);
  }
  @Patch(':groupId/lock')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async lock(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() body: { locked: boolean },
  ) {
    await this.assertTeacher(req, id);
    return this.groups.setLocked(id, groupId, Boolean(body.locked));
  }
  @Post(':groupId/admin-repository')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async adminRepo(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    await this.assertTeacher(req, id);
    return this.groups.ensureRepository(id, groupId, true);
  }
  @Post(':groupId/retry')
  @Roles(USER_ROLES.DOCENTE, USER_ROLES.ADMIN)
  async retry(
    @Request() req,
    @Param('exerciseId', ParseIntPipe) id: number,
    @Param('groupId', ParseIntPipe) groupId: number,
  ) {
    await this.assertTeacher(req, id);
    return this.groups.ensureRepository(id, groupId, true);
  }
}
