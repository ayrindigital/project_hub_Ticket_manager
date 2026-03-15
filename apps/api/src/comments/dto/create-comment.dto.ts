import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(1, 1000)
  content!: string;

  @IsString()
  @Length(2, 80)
  author!: string;
}
