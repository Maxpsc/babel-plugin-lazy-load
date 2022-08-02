import React, { useState } from 'react';
import { Tooltip, message } from 'm-ui';
import { Button, useMobile } from '@ad/r-ui'
import { NormalOfflineLine } from '@m-ui/icons';
import EventEmitter from 'eventemitter3';
import {
  initAxios,
  performanceDataApiUsingPOST,
  getDataFromSwaggerInterface,
} from '../common/performance-data-api';
import { transformParams } from '../common/utils';
import { IProps } from './interface';
import './index.less';

let ee;
if (window._eventEmitter) {
  ee = window._eventEmitter;
} else {
  ee = new EventEmitter();
  window._eventEmitter = ee;
}

const DOWNLOAD_TYPE = {
  ASYNC_TASK: '1', // 异步任务
  FILE_URL: '2', // 后端返回文件地址
  RAW_FILE: '3', // 后端返回原始文件内容
}

// 根据文件地址下载文件
const downloadFile = (url, name) => {
  function download(path) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = path;
    a.download = name;
    a.click();
  }

  if (!!URL?.createObjectURL && !!URL?.revokeObjectURL) {
    const xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.responseType = 'blob';
    xhr.send();
    xhr.onload = function () {
      if (this.status === 200 || this.status === 304) {
        if ('msSaveOrOpenBlob' in navigator) {
          navigator.msSaveOrOpenBlob(this.response, name);
          return;
        }
        const url = URL.createObjectURL(this.response);
        download(url);
        URL.revokeObjectURL(url);
      }
    };
  } else {
    download(url);
  }
};

const iconMap = {
  export: <NormalOfflineLine />,
};

let hasSetAxios = false;
export default function CrmDataButton(props) {
  const prefix = 'crm-data-cc';
  // console.log('button props', props);
  const {
    type,
    width,
    height,
    text,
    tipText,
    tipPlacement,
    tipMaxWidth,
    emitEventGroup,
    apiKey,
    apiDataKey,
    params,
    downloadType = DOWNLOAD_TYPE.ASYNC_TASK,
    downloadMessage,
    reqMethod = 'get',
    downloadFileName,
    noCapi,
    icon,
    noText,
  } = props;
  if (!hasSetAxios) {
    initAxios(noCapi);
    hasSetAxios = true;
  }

  const isMobile = useMobile();
  const [loading, setLoading] = useState(false);

  const contentButton = (
    <Button
      className={`${type === 'link' || type === 'text' ? 'btn-no-padding-lr' : ''}`}
      type={type || 'primary'}
      style={{
        width: width || 'auto',
        height: height || 'auto',
      }}
      onClick={async () => {
        // 有接口触发标志，触发事件
        if (emitEventGroup) {
          if (Array.isArray(emitEventGroup)) {
            emitEventGroup.forEach(eventName => {
              ee.emit(eventName, {});
            });
          } else {
            ee.emit(emitEventGroup, {});
          }
        }

        // 存在接口配置请求接口
        if (apiKey) {
          setLoading(true);
          const targetParams = transformParams(params, apiKey.includes('/'));
          try {
            let res;
            if (apiKey.includes('/')) {
              // 包含/，代表是swagger接口
              res = await getDataFromSwaggerInterface(apiKey, targetParams, reqMethod);
            } else {
              // 反之，代表是配置化接口
              res = await performanceDataApiUsingPOST({
                key: apiKey,
                ...targetParams,
              });
            }
            if (res.result === 1) {
              if (downloadType === DOWNLOAD_TYPE.ASYNC_TASK) {
                message.success(downloadMessage || '下载任务添加成功');
              } else if (downloadType === DOWNLOAD_TYPE.FILE_URL) {
                let data;
                if (apiDataKey) {
                  data = res.data[apiDataKey];
                } else {
                  data = res.data;
                }
                data && downloadFile(data, downloadFileName || '数据下载');
              }
            } else {
              console.log('文件下载失败', res);
            }
          } catch (e) {
            console.log('文件下载失败', e);
          } finally {
            setLoading(false);
          }
        }
      }}
      loading={loading}
    >
      {noText ? undefined : text || '按钮'}
      {icon && iconMap[icon]}
    </Button>
  );

  // 移动端 & 具有下载操作 =》不展示
  if (isMobile && apiKey) {
    return null;
  }

  return (
    <div className={`${prefix} select`}>
      {tipText ? (
        <Tooltip
          title={tipText}
          placement={tipPlacement || 'top'}
          overlayInnerStyle={{
            maxWidth: tipMaxWidth || 'auto',
          }}
        >
          {contentButton}
        </Tooltip>
      ) : (
        contentButton
      )}
    </div>
  );
}
