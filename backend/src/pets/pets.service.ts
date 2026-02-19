import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PetsService {
  constructor(private dbService: DatabaseService) {}

  async getOrCreatePet(userId: string) {
    let { data, error } = await this.dbService.db
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If pet doesn't exist, create one
    if (!data || error) {
      const newPetData = { user_id: userId, level: 0, experience: 0 };
      ({ data, error } = await this.dbService.db
        .from('pets')
        .insert([newPetData])
        .single());
    }

    if (error) throw error;
    return data;
  }

  async addExperience(userId: string, amount: number) {
    const pet = await this.getOrCreatePet(userId);
    const newExp = pet.experience + amount;
    const newLevel = Math.floor(newExp / 50);

    const { data, error } = await this.dbService.db
      .from('pets')
      .update({ experience: newExp, level: newLevel })
      .eq('user_id', userId)
      .async();

    if (error) throw error;
    
    // Find the updated pet from the returned data
    const updatedPet = (data || []).find((p: any) => p.user_id === userId) || { level: newLevel, experience: newExp };
    return { pet: updatedPet, leveledUp: newLevel > pet.level };
  }

  async getPetLevel(userId: string) {
    const pet = await this.getOrCreatePet(userId);
    const progress = pet.experience % 50;
    return {
      level: pet.level,
      experience: pet.experience,
      progress,
      nextLevelAt: 50 - progress,
      avatar: this.getAvatarForLevel(pet.level),
    };
  }

  private getAvatarForLevel(level: number): string {
    const avatars: { [key: number]: string } = {
      0: '🥚',
      1: '🐣',
      2: '🐤',
      3: '🐥',
      4: '🦆',
      5: '🦉',
    };
    return avatars[Math.min(level, 5)] || '🦉';
  }
}
