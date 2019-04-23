/*
app-support/app.js中IOS-Weixin配置例子，用于支持ios的微信中使用微信JsSDK来录音

此文件需要在app.js之前进行加载

https://github.com/xiangyuecn/Recorder
*/
"use strict";

console.error("本网站正在使用RecordApp测试配置例子，正式使用时需要改动哦");

//请使用自己的js文件，不要用我的，github.io直接外链【超级】【不稳定】
var RecordAppBaseFolder=window.PageSet_RecordAppBaseFolder||"https://xiangyuecn.github.io/Recorder/src/";
//请使用自己的素材下载接口，不要用我的，微信【强制】要【绑安全域名】，别的站用不了
var MyWxApi="https://jiebian.life/api/weixin/git_record";


//在RecordApp准备好时自行这些代码
var OnRecordAppInstalled=function(){


var App=RecordApp;
var platform=App.Platforms.Weixin;
var config=platform.Config;

var win=window.top;//微信JsSDK让顶层去加载，免得iframe各种麻烦

//手撸一个ajax
var ajax=function(url,data,True,False){
	var xhr=new XMLHttpRequest();
	xhr.timeout=20000;
	xhr.open("POST",url);
	xhr.onreadystatechange=function(){
		if(xhr.readyState==4){
			if(xhr.status==200){
				var o=JSON.parse(xhr.responseText);
				if(o.c){
					False(o.m);
					return;
				};
				True(o);
			}else{
				False("请求失败["+xhr.status+"]");
			}
		}
	};
	var arr=[];
	for(var k in data){
		arr.push(k+"="+encodeURIComponent(data[k]));
	};
	xhr.send(arr.join("&"));
};

/*********实现配置项*************/
config.WxReady=function(call){
	//此方法需要自行实现，需要在微信JsSDK wx.config好后调用call(wx,err)函数
	if(!win.WxReady){
		win.eval("var InitJsSDK="+InitJsSDK.toString()+";InitJsSDK")(App,MyWxApi,ajax);
	};
	
	win.WxReady(call);
};
config.DownWxMedia=function(mediaId,success,fail){
	/*下载微信录音素材，服务器端接口文档： https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1444738727
		mediaId： 录音接口上传得到的微信服务器上的ID
		success： fn(obj) 下载成功返回结果
			obj:{
				mime:"audio/amr" //这个值是服务器端请求临时素材接口返回的Content-Type响应头
				,data:"base64文本" //服务器端下载到的文件二进制内容进行base64编码
			}
		fail: fn(msg) 下载出错回调
	*/
	
	ajax(MyWxApi,{
		action:"wxdown"
		,mediaID:mediaId
	},function(data){
		success(data.v);
	},function(msg){
		fail("下载音频失败："+msg);
	});
};




/*********JsSDK*************/
var InitJsSDK=function(App,MyWxApi,ajax){
	var wxOjbK=function(call){
		if(errMsg){
			call(null,errMsg);
			return;
		};
		
		wxConfig(function(){
			call(wx);
		},function(msg){
			call(wx,"请求微信接口失败: "+msg);
		});
	};
	
	//微信环境准备完毕
	window.WxReady=function(call){
		if(isReady){
			wxOjbK(call);
		}else{
			calls.push(call);
		};
	};
	var isReady=false;
	var calls=[];
	var errMsg="";
	
	App.Js([{url:"https://res.wx.qq.com/open/js/jweixin-1.4.0.js",check:function(){return true}}],function(){
		console.log("weixin jssdk准备好了");
		
		isReady=true;
		var arr=calls;
		calls=[];
		for(var i=0;i<arr.length;i++){
			wxOjbK(arr[i]);
		};
	},function(msg){
		isReady=true;
		errMsg="初始化微信JsSDK失败，请刷新页面："+msg;
	},window);
	
	
	
	//等等完成签名
	var wxConfigStatus=0;
	var wxConfigErr="";
	var wxConfigCalls=[];
	var wxConfig=function(True,False){
		if(wxConfigStatus==6){
			True();
			return;
		}else if(wxConfigStatus==5){
			False(wxConfigErr);
			return;
		};
		wxConfigCalls.push({t:True,f:False});
		var end=function(err){
			if(wxConfigStatus<5){			
				wxConfigErr=err?"微信config失败，请刷新页面重试："+err:"";
				wxConfigStatus=err?5:6;
				for(var i=0;i<wxConfigCalls.length;i++){
					var o=wxConfigCalls[i];
					if(err){
						o.f(wxConfigErr);
					}else{
						o.t();
					};
				};
			};
		};
		if(wxConfigStatus!=0){
			return;
		};
		wxConfigStatus=1;
		
		var config=function(data){
			wx.config({
				debug:false
				,appId:data.appid
				,timestamp:data.timestamp
				,nonceStr:data.noncestr
				,signature:data.signature
				,jsApiList:("getLocation"
+",startRecord,stopRecord,onVoiceRecordEnd"
+",playVoice,pauseVoice,stopVoice,onVoicePlayEnd"
+",uploadVoice,downloadVoice"
).split(",")
			});
			wx.error(function(res){
				console.error("wx.config",res);
				end(res.errMsg);
			});
			wx.ready(function(){
				console.log("微信JsSDK签名配置完成");
				end();
			});
		};
		ajax(MyWxApi,{
			action:"sign"
			,url:location.href.replace(/#.*/g,"")
		},function(data){
			config(data.v);
		},end);
	};
};



};


if(!/^file:|:\/\/[^\/]*(jiebian.life|github.io)(\/|$)/.test(location.href))
	alert("本网站正在使用RecordApp测试配置例子，正式使用时需要改动哦");


if(window.RecordApp){
	OnRecordAppInstalled();
};