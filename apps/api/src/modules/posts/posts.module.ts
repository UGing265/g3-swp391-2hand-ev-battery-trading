import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { AuthModule } from '../auth/auth.module';
import { PostDetailsModule } from '../post-details/post-details.module';
import { PostImage } from './entities/post-image.entity';
import { UploadModule } from '../upload/upload.module';
import { AddressModule } from '../address/address.module';
import { PostReviewModule } from '../post-review/post-review.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostImage]),
    AuthModule,
    UploadModule,
    AddressModule,
    PostReviewModule,
    // nếu sợ vòng phụ thuộc, có thể forwardRef — không bắt buộc ở đây
    forwardRef(() => PostDetailsModule),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
