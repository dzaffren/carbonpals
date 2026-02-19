import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'Just logged my first carbon footprint!', description: 'Post content' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'I tracked $150 in expenses today...', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'achievement', required: false })
  @IsOptional()
  @IsString()
  post_type?: string;
}

export class CommentDto {
  @ApiProperty({ example: 'Great job!', description: 'Comment content' })
  @IsString()
  content!: string;
}

export class PostDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  user_id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content?: string;

  @ApiProperty()
  post_type!: string;

  @ApiProperty()
  likes_count!: number;

  @ApiProperty()
  created_at!: string;

  @ApiProperty()
  updated_at!: string;
}
