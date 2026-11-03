import { localRepository } from './local';
import { StudyRepository } from './types';

export const repository: StudyRepository = localRepository;
export * from './types';
