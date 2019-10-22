#include "fwu.h"

Napi::Value napi_DownloadFirmware(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();
  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string version = info[1].As<Napi::String>();
    const std::string authorization = info[2].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[3].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, version, authorization](){ 
        Jabra_ReturnCode ret = Jabra_DownloadFirmware(deviceId, version.c_str(), authorization.c_str());
        if (ret != Return_Async && ret != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, ret);
        }
      }
    ))->Queue();
  }
  return env.Undefined();
}

Napi::Value napi_UpdateFirmware(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();
  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string firmFile = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, firmFile](){ 
        Jabra_ReturnCode ret = Jabra_UpdateFirmware(deviceId, firmFile.c_str());
        if (ret != Return_Async && ret != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, ret);
        }
      }
    ))->Queue();
  }
  return env.Undefined();
}

Napi::Value napi_DownloadFirmwareUpdater(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();
  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string authorization = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, authorization](){ 
        Jabra_ReturnCode ret = Jabra_DownloadFirmwareUpdater(deviceId, authorization.c_str());
        if (ret != Return_Async && ret != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, ret);
        }
      }
    ))->Queue();
  }
  return env.Undefined();
}

Napi::Value napi_GetFirmwareFilePath(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();
  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string version = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<std::string, Napi::String>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, version](){ 
        if (char * result = Jabra_GetFirmwareFilePath(deviceId, version.c_str())) {
          std::string managedResult(result);
          Jabra_FreeString(result);
          return managedResult;
        }
        throw util::JabraException(functionName, "Jabra_GetFirmwareFilePath yielded no result");
      },
      [](const Napi::Env& env, const std::string& filePath) { 
        Napi::String napiResult = Napi::String::New(env, filePath.c_str());
        return napiResult;
      }))->Queue();
  }
  return env.Undefined();
}

Napi::Value napi_IsFirmwareLockEnabled(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsFirmwareLockEnabled(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_GetFirmwareVersion(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::String, std::string>(functionName, info, 
    [functionName](unsigned short deviceId) {
      char buf[64];
      Jabra_ReturnCode retv;
      if ((retv = Jabra_GetFirmwareVersion(deviceId, &buf[0], sizeof(buf))) == Return_Ok) {
        return std::string(buf);
      } else {
        util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        return std::string(); // Dummy return - avoid compiler warnings.
      }
    }, 
    [](const Napi::Env& env, const std::string& cppResult) {  return Napi::String::New(env, cppResult); }
  );
}

Napi::Value napi_GetLatestFirmwareInformation(const Napi::CallbackInfo& info) {  
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string authorizationId = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<Jabra_FirmwareInfo *, Napi::Object>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, authorizationId](){ 
        Jabra_FirmwareInfo * fwInfo = Jabra_GetLatestFirmwareInformation(deviceId, authorizationId.c_str());

        if (!fwInfo) {
          util::JabraException::LogAndThrow(functionName, "null returned");
        }
        
        return fwInfo;
      },
      [](const Napi::Env& env, Jabra_FirmwareInfo *fwInfo) { 
        Napi::Object napiResult = Napi::Object::New(env);

        if (fwInfo) {
          if (fwInfo->version) {
            napiResult.Set(Napi::String::New(env, "version"), (Napi::String::New(env, fwInfo->version)));
          }
          if (fwInfo->fileSize) {
            napiResult.Set(Napi::String::New(env, "fileSize"), (Napi::String::New(env, fwInfo->fileSize)));
          }
          if (fwInfo->releaseDate) {
            napiResult.Set(Napi::String::New(env, "releaseDate"), (Napi::String::New(env, fwInfo->releaseDate)));
          }
          if (fwInfo->stage) {
            napiResult.Set(Napi::String::New(env, "stage"), (Napi::String::New(env, fwInfo->stage)));     
          } 
          if (fwInfo->releaseNotes) { 
            napiResult.Set(Napi::String::New(env, "releaseNotes"), (Napi::String::New(env, (const char16_t*)fwInfo->releaseNotes)));
          }
        }

        return napiResult;
      }, [](Jabra_FirmwareInfo * fwInfo) {
        if (fwInfo) {
          Jabra_FreeFirmwareInfo(fwInfo);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}  

Napi::Value napi_CancelFirmwareDownload(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[1].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_CancelFirmwareDownload(deviceId)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_CheckForFirmwareUpdate(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
   const std::string authorizationId = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName,deviceId,authorizationId](){ 
        Jabra_ReturnCode retv;   
        if ((retv = Jabra_CheckForFirmwareUpdate(deviceId, authorizationId.c_str())) != Return_Ok) {                    
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

/**
* Copy a native sdk Jabra_FirmwareErrorInfo object into an empty napi device Jabra_FirmwareErrorInfo object (the reverse of toCType).
*/

static void toNodeType(const unsigned short deviceId, Jabra_FirmwareErrorInfo *src, Napi::Object& dest) {
    Napi::Env env = dest.Env();
    dest.Set(Napi::String::New(env, "errorExceptionType"), Napi::String::New(env, src->errorExceptionType ? src->errorExceptionType : ""));
    dest.Set(Napi::String::New(env, "errorMessage"),  Napi::String::New(env, src->errorMessage ? src->errorMessage : ""));
    dest.Set(Napi::String::New(env, "errorDetails"),  Napi::String::New(env, src->errorDetails ? src->errorDetails : ""));
}

Napi::Value napi_GetLastFirmwareUpdateErrorInfo(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[1].As<Napi::Function>();

    (new util::JAsyncWorker<Jabra_FirmwareErrorInfo *, Napi::Object>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId]() -> Jabra_FirmwareErrorInfo * { 
        Jabra_FirmwareErrorInfo * const fwUpdateErrorInfo = Jabra_GetLastFirmwareUpdateErrorInfo(deviceId);

        if (!fwUpdateErrorInfo) {
          util::JabraException::LogAndThrow(functionName, "GetLastFirmwareUpdateErrorInfo yielded no result");
        } else {
            IF_LOG(plog::verbose) {
              //LOG_VERBOSE << "napi_GetLastFirmwareUpdateErrorInfo got raw object : '" << toString(fwUpdateErrorInfo) << "'";
            }
        }

        return fwUpdateErrorInfo;
      }, [deviceId](const Napi::Env& env, Jabra_FirmwareErrorInfo * const fwUpdateErrorInfo) {  
          Napi::Object napiResult = Napi::Object::New(env);
          if (fwUpdateErrorInfo) {
            toNodeType(deviceId, fwUpdateErrorInfo, napiResult);
          }
          return napiResult;
      }, [](Jabra_FirmwareErrorInfo * fwUpdateErrorInfo) {
          if (fwUpdateErrorInfo) {
            Jabra_FreeFirmwareErrorInfo(fwUpdateErrorInfo);
          }
      }
    ))->Queue();
  }

  return env.Undefined();
}