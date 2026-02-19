import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreatePostDto, CommentDto, PostDto } from './dtos/post.dto';

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Post created', type: PostDto })
  async createPost(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    return this.socialService.createPost(req.user.id, createPostDto);
  }

  @Get('feed')
  @ApiResponse({ status: 200, description: 'Social feed with posts' })
  async getFeed(@Query('limit') limit = 20, @Query('offset') offset = 0) {
    return this.socialService.getFeed(limit, offset);
  }

  @Get('posts/:id')
  @ApiResponse({ status: 200, description: 'Get single post with comments' })
  async getPost(@Param('id') id: string) {
    return this.socialService.getPostById(id);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Comment created' })
  async addComment(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() commentDto: CommentDto,
  ) {
    return this.socialService.addComment(postId, req.user.id, commentDto);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Post liked' })
  async likePost(@Param('id') postId: string) {
    return this.socialService.likePost(postId);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Post deleted' })
  async deletePost(@Request() req: any, @Param('id') postId: string) {
    return this.socialService.deletePost(postId, req.user.id);
  }
}
