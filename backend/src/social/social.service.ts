import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePostDto, CommentDto } from './dtos/post.dto';

@Injectable()
export class SocialService {
  constructor(private dbService: DatabaseService) {}


  async createPost(userId: string, createPostDto: CreatePostDto) {
    const { data, error } = await this.dbService.db
      .from('social_posts')
      .insert([
        {
          user_id: userId,
          title: createPostDto.title,
          content: createPostDto.content || null,
          post_type: createPostDto.post_type || 'update',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFeed(limit = 20, offset = 0) {
    const { data, error } = await this.dbService.db
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .async();

    if (error) throw error;
    const paginated = (data || []).slice(offset, offset + limit);
    return { data: paginated, total: data?.length || 0 };
  }

  async getPostById(postId: string) {
    const { data, error } = await this.dbService.db
      .from('social_posts')
      .select(
        `*,
        user:users(id, username, display_name, avatar_url),
        comments(id, content, user:users(username), created_at)`
      )
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data;
  }

  async addComment(postId: string, userId: string, commentDto: CommentDto) {
    const { data, error } = await this.dbService.db
      .from('comments')
      .insert([
        {
          post_id: postId,
          user_id: userId,
          content: commentDto.content,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async likePost(postId: string) {
    const { data, error } = await this.dbService.db
      .from('social_posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    if (error) throw error;

    const { data: updated, error: updateError } = await this.dbService.db
      .from('social_posts')
      .update({ likes_count: (data.likes_count || 0) + 1 })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  async deletePost(postId: string, userId: string) {
    const { error } = await this.dbService.db
      .from('social_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }
}
