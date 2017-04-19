### Using Grunt 使用grunt压缩js和css文件  
- 首先要安卓nodejs 
  -  因为grunt是基于NodeJs的，所以首先各位需要安装NodeJS环境
- 全局安装grunt-cli  
  - cmd输入：npm install -g grunt-cli  

- 编辑package.json文件，下载相关依赖  
  - 
![package.json.png](http://upload-images.jianshu.io/upload_images/5307186-abced3aad859a6b3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
** 执行npm install （淘宝镜像cnpm install）**

- 使用说明
  - 在Gruntfile.js文件中配置js和css文件的输入输出路径
  - 根目录下的css文件夹用于放置待压缩的css文件
  - 根目录下的js文件夹用于放置带压缩的js文件
  - build目录下用户放置压缩后的输出文件
-Github地址：https://github.com/ivonzhang/grunt-compress-js-css.git