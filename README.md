# swagger-more-portal
swagger-more的前端UI代码
  
![UI](https://raw.githubusercontent.com/uhfun/swagger-more/master/ui.png)

# swagger-more
[swagger-more github地址，点击前往](https://github.com/uhfun/swagger-more)

​		公司内部测试需要dubbo接口提供文档， 实习的闲暇之余有好奇Swagger2的代码，看看它怎么大致的流程如何，后面又希望能灵活调试 。由此想到基于springfox swagger2来实现一个类似swagger http文档的dubbo文档。  

​        github上也有类似功能的项目, 不过项目存在问题并且作者也没有维护

* https://github.com/Sayi/swagger-dubbo

* https://github.com/zhaojigang/springfox

  动态生成带注解的Controller来进行api信息的读取，但是个人感觉这个做法不是特别优雅，springfox官方已经提供了一套扩展性比较强的接口来可以实现api信息的读取。
