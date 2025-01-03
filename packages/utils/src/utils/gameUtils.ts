import { GameDto, TagDto } from '@biketag/models';

export const gameHasTag = (game: GameDto): game is GameDto & { latestRootTag: TagDto; firstRootTag: TagDto } => {
    return game.latestRootTag !== undefined;
};
