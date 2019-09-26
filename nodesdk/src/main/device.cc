#include "device.h"
#include "napiutil.h"
#include <string.h>



Napi::Value napi_GetDeviceImagePath(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::String, std::string>(functionName, info, [functionName](unsigned short deviceId) {
    if (char * result = Jabra_GetDeviceImagePath(deviceId)) {
      std::string managedResult(result);
      Jabra_FreeString(result);
      return managedResult;
    } else {
      util::JabraException::LogAndThrow(functionName, "null returned");
      return std::string(); // Dummy return - avoid compiler warnings.
    }
  }, [](const Napi::Env& env, const std::string& cppResult) { 
    return Napi::String::New(env, cppResult); 
  });
}

Napi::Value napi_GetDeviceImageThumbnailPath(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::String, std::string>(functionName, info, [functionName](unsigned short deviceId) {
    if (char * result = Jabra_GetDeviceImageThumbnailPath(deviceId)) {
      std::string managedResult(result);
      Jabra_FreeString(result);
      return managedResult;
    } else {
      util::JabraException::LogAndThrow(functionName, "null returned");
      return std::string(); // Dummy return - avoid compiler warnings.
    }
  }, [](const Napi::Env& env, const std::string& cppResult) {  return Napi::String::New(env, cppResult); });
}

Napi::Value napi_IsGnHidStdHidSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(functionName, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsGnHidStdHidSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_GetHidWorkingState(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Number, Jabra_HidState>(functionName, info, [functionName](unsigned short deviceId) {
    Jabra_ReturnCode retv;
    Jabra_HidState state;
    if ((retv = Jabra_GetHidWorkingState(deviceId, &state)) == Return_Ok) {
      return state;
    } else {
      util::JabraReturnCodeException::LogAndThrow(functionName, retv);
      return state; // Dummy return - avoid compiler warnings.
    }
  }, [](const Napi::Env& env, Jabra_HidState cppResult) {  return Napi::Number::New(env, cppResult); });
}

Napi::Value napi_SetHidWorkingState(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const Jabra_HidState state = (Jabra_HidState)(info[1].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, state](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_SetHidWorkingState(deviceId, state)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_IsRingerSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(functionName, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsRingerSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_SetRinger(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncBoolSetter(functionName, info, [functionName](unsigned short deviceId, bool enable) {
        const Jabra_ReturnCode result = Jabra_SetRinger(deviceId, enable);
        if (result != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, result);
        }
  });
}

Napi::Value napi_IsOffHookSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(functionName, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsOffHookSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}


Napi::Value napi_SetOffHook(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncBoolSetter(functionName, info, [functionName](unsigned short deviceId, bool enable) {
        const Jabra_ReturnCode result = Jabra_SetOffHook(deviceId, enable);
        if (result != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, result);
        }
  });
}

Napi::Value napi_IsOnlineSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsOnlineSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_IsMuteSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsMuteSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_IsHoldSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsHoldSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_IsBusyLightSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsBusylightSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_UploadRingtone(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string fileName = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, fileName](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_UploadRingtone(deviceId, fileName.c_str())) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_UploadWavRingtone(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string fileName = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, fileName](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_UploadWavRingtone(deviceId, fileName.c_str())) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_UploadImage(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string fileName = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, fileName](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_UploadImage(deviceId, fileName.c_str())) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_GetNamedAsset(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::STRING, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const std::string assetName = info[1].As<Napi::String>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<CNamedAsset*, Napi::Object>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, assetName](){ 
        Jabra_ReturnCode retv;
        CNamedAsset* asset = nullptr;
        if ((retv = Jabra_GetNamedAsset(deviceId, assetName.c_str(), &asset)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
        return asset;
      },
      [](const Napi::Env& env, CNamedAsset* asset) {
        Napi::Object jResult = Napi::Object::New(env);

        Napi::Array jElements = Napi::Array::New(env);

        if (asset != nullptr) {
          for (unsigned int i=0; i<asset->element_count; ++i) {
            CAssetElement src = asset->elements[i];
            Napi::Object jElement = Napi::Object::New(env);
            jElement.Set(Napi::String::New(env, "url"), Napi::String::New(env, src.url ? src.url : ""));
            jElement.Set(Napi::String::New(env, "mime"), Napi::String::New(env, src.mime ? src.mime : ""));
            jElements.Set(i, jElement);
          }
        }

        jResult.Set(Napi::String::New(env, "elements"), jElements);

        Napi::Array jMetadata = Napi::Array::New(env);
        if (asset != nullptr) {
          for (unsigned int i=0; i<asset->metadata_count; ++i) {
            CAssetMetadata src = asset->metadata[i];
            Napi::Object jSingleMetaData = Napi::Object::New(env);
            jSingleMetaData.Set(Napi::String::New(env, "name"), Napi::String::New(env, src.name ? src.name : ""));
            jSingleMetaData.Set(Napi::String::New(env, "value"), Napi::String::New(env, src.value ? src.value : ""));
            jMetadata.Set(i, jSingleMetaData);
          }
        }

        jResult.Set(Napi::String::New(env, "metadata"), jMetadata);

        return jResult;
      },
      [](CNamedAsset* asset) {
        if (asset != nullptr) {
          Jabra_FreeAsset(asset);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_GetSupportedButtonEvents(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[1].As<Napi::Function>();

    (new util::JAsyncWorker<ButtonEvent*, Napi::Object>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId](){ 
        ButtonEvent* buttonEvent = nullptr;
        buttonEvent = Jabra_GetSupportedButtonEvents(deviceId);
        return buttonEvent;
      },
      [](const Napi::Env& env, ButtonEvent* buttonEvent) {

        Napi::Array jElements = Napi::Array::New(env);

        if (buttonEvent != nullptr) { 
          for ( int i=0; i<buttonEvent->buttonEventCount; ++i) {
            ButtonEventInfo btnEventInfo = buttonEvent->buttonEventInfo[i];
            Napi::Object jElement = Napi::Object::New(env);
            jElement.Set(Napi::String::New(env, "buttonTypeKey"), Napi::Number::New(env, btnEventInfo.buttonTypeKey));
            jElement.Set(Napi::String::New(env, "buttonTypeValue"), Napi::String::New(env, btnEventInfo.buttonTypeValue ? btnEventInfo.buttonTypeValue : ""));
            Napi::Array newElements = Napi::Array::New(env);
            for (unsigned int j=0; j<(unsigned int)btnEventInfo.buttonEventTypeSize; ++j) {
              ButtonEventType btnEventTypeInfo = btnEventInfo.buttonEventType[j];
              Napi::Object newElement = Napi::Object::New(env);
              newElement.Set(Napi::String::New(env, "key"), Napi::Number::New(env, btnEventTypeInfo.key));
              newElement.Set(Napi::String::New(env, "value"), Napi::String::New(env, btnEventTypeInfo.value ? btnEventTypeInfo.value : ""));
              
              newElements.Set(j, newElement);
            }
            jElements.Set(i, jElement);
          }
        }
        return jElements;
        
      },
      [](ButtonEvent* buttonEvent) {
        if (buttonEvent != nullptr) {
          Jabra_FreeButtonEvents(buttonEvent);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
  
}

Napi::Value napi_SetMute(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncBoolSetter(functionName, info, [functionName](unsigned short deviceId, bool enable) {
        const Jabra_ReturnCode result = Jabra_SetMute(deviceId, true);
        if (result != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, result);
        }
  });
}

Napi::Value napi_SetUnmute(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncBoolSetter(functionName, info, [functionName](unsigned short deviceId, bool enable) {
        const Jabra_ReturnCode result = Jabra_SetMute(deviceId, false);
        if (result != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, result);
        }
  });
}

Napi::Value napi_IsSetDateTimeSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsSetDateTimeSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_IsFeatureSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const DeviceFeature feature = (DeviceFeature)(info[1].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<bool, Napi::Boolean>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, feature](){ 
        return Jabra_IsFeatureSupported(deviceId, feature);
      },
      [](const Napi::Env& env, const bool result) {
        return Napi::Boolean::New(env, result);
      }
    ))->Queue();
  }

  return env.Undefined();
}


Napi::Value napi_IsEqualizerSupported(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsEqualizerSupported(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_IsEqualizerEnabled(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Boolean, bool>(__func__, info, [](unsigned short deviceId) {
    bool retv = Jabra_IsEqualizerEnabled(deviceId);
    return retv;
  }, [](const Napi::Env& env, bool cppResult) {  return Napi::Boolean::New(env, cppResult); });
}

Napi::Value napi_EnableEqualizer(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncBoolSetter(functionName, info, [functionName](unsigned short deviceId, bool enable) {
        const Jabra_ReturnCode result = Jabra_EnableEqualizer(deviceId, enable);
        if (result != Return_Ok) {
          throw util::JabraReturnCodeException(functionName, result);
        }
  });
}

Napi::Value napi_SetEqualizerParameters(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::NUMBER, util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    float bands =(unsigned short)(info[1].As<Napi::Number>().Int32Value());
    const unsigned int nbands = (unsigned int)(info[2].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[3].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName,deviceId,&bands,nbands](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_SetEqualizerParameters(deviceId,&bands,nbands)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_SetTimestamp(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const uint32_t newTime = (unsigned int)(info[1].As<Napi::Number>().Int32Value());//Int64Value() should be used once Jabra sdk supports it.
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName,deviceId,newTime](){ 
        Jabra_ReturnCode retv;   
        if ((retv = Jabra_SetTimestamp(deviceId, newTime)) != Return_Ok) {                    
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_PlayRingTone(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::NUMBER, util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const uint8_t level = (unsigned short)(info[1].As<Napi::Number>().Int32Value());
    const uint8_t type = (unsigned short)(info[2].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[3].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName,deviceId,level,type](){ 
        Jabra_ReturnCode retv;   
        if ((retv = Jabra_PlayRingtone(deviceId,level,type)) != Return_Ok) {                    
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_GetESN(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::String, std::string>(functionName, info, 
    [functionName](unsigned short deviceId) {
      char esn[64];
      Jabra_ReturnCode retv;
      if ((retv = Jabra_GetESN(deviceId, &esn[0], sizeof(esn))) == Return_Ok) {
        return std::string(esn);
      } else {
        util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        return std::string(); // Dummy return - avoid compiler warnings.
      }
    }, 
    [](const Napi::Env& env, const std::string& cppResult) {  return Napi::String::New(env, cppResult); 
    }
  );
}

Napi::Value napi_GetTimestamp(const Napi::CallbackInfo& info) {
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
         uint32_t result;                    
        if ((retv = Jabra_GetTimestamp(deviceId,&result)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
        return result;
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_GetAudioFileParametersForUpload(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Object, Jabra_AudioFileParams >(functionName, info, 
    [functionName](unsigned short deviceId) {
      return Jabra_GetAudioFileParametersForUpload(deviceId);
    },
    [](const Napi::Env& env, const Jabra_AudioFileParams& audioFileParams) { 
      Napi::Array array = Napi::Array::New(env);
      {
        Napi::Object item = Napi::Object::New(env);
        item.Set(Napi::String::New(env, "audioFileType"), (Napi::Number::New(env, audioFileParams.audioFileType)));
        item.Set(Napi::String::New(env, "numChannels"), (Napi::Number::New(env, audioFileParams.numChannels)));
        item.Set(Napi::String::New(env, "bitsPerSample"), (Napi::Number::New(env,audioFileParams.bitsPerSample)));
        item.Set(Napi::String::New(env, "sampleRate"), (Napi::Number::New(env,audioFileParams.sampleRate)));
        item.Set(Napi::String::New(env, "maxFileSize"), (Napi::Number::New(env,audioFileParams.maxFileSize)));
      }
      return array;
    }
  );
}

Napi::Value napi_GetWizardMode(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleDeviceAsyncFunction<Napi::Number, WizardModes>(functionName, info, [functionName](unsigned short deviceId) {
    Jabra_ReturnCode retv;
    WizardModes wizardModes;
    if ((retv = Jabra_GetWizardMode(deviceId, &wizardModes)) == Return_Ok) {
      return wizardModes;
    } else {
      util::JabraReturnCodeException::LogAndThrow(functionName, retv);
      return wizardModes; // Dummy return - avoid compiler warnings.
    }
  }, [](const Napi::Env& env, WizardModes cppResult) {  return Napi::Number::New(env, cppResult); });
}

Napi::Value napi_SetWizardMode(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    const WizardModes modes = (WizardModes)(info[1].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId,modes](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_SetWizardMode(deviceId,modes)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

/**
 * Convert a napi Button event object to a native sdk ButtonEvent object (the reverse of toNodeType).
 * 
 * Nb. Use Custom_FreeButtonEvents to free memory allocated by this function.
 */
static ButtonEvent *toCType(const unsigned short buttonevent, Napi::Object src) {
    ButtonEvent * result = new ButtonEvent();

    Napi::Array buttonEventInfo = src.Get("buttonEventInfo").As<Napi::Array>();
    if (buttonEventInfo.IsArray()) {
        result->buttonEventCount = util::getObjInt32OrDefault(buttonEventInfo, "buttonEventCount", 0);
        result->buttonEventInfo = new ButtonEventInfo[result->buttonEventCount];

        for ( int i=0; i<result->buttonEventCount; ++i) {
            ButtonEventInfo& btnEventDst = result->buttonEventInfo[i];
            Napi::Object btnEventSrc = buttonEventInfo.Get(i).ToObject();

            btnEventDst.buttonTypeKey = util::getObjInt32OrDefault(btnEventSrc, "buttonTypeKey", -1);
            btnEventDst.buttonTypeValue = newCString(btnEventSrc.Get("buttonTypeValue"));
            btnEventDst.buttonEventTypeSize = util::getObjInt32OrDefault(btnEventSrc, "buttonEventTypeSize", -1);
            btnEventDst.buttonEventType = new ButtonEventType[btnEventDst.buttonEventTypeSize];

            Napi::Array buttonEventTypeArray = btnEventSrc.Get("buttonEventType").As<Napi::Array>();
            if (buttonEventTypeArray.IsArray()) {
                for (int j=0; j<btnEventDst.buttonEventTypeSize; ++j) {
                    ButtonEventType& btnEventTypeDst = btnEventDst.buttonEventType[j];
                    Napi::Object btnEventTypeSrcObj = buttonEventTypeArray.Get(j).As<Napi::Object>();

                    btnEventTypeDst.key = util::getObjInt32OrDefault(btnEventTypeSrcObj, "key", 0);
                    btnEventTypeDst.value = newCString(btnEventTypeSrcObj.Get("value"));
                }
            } else {
                btnEventDst.buttonEventTypeSize = 0;
                btnEventDst.buttonEventType = nullptr;
            }
        }
    } else {
        result->buttonEventCount = 0;
        result->buttonEventInfo = nullptr;
    }

    return result;
}


static void Custom_FreeButtonEvents(ButtonEvent* buttonEvent) {
	if (buttonEvent != nullptr) {
		if (buttonEvent->buttonEventInfo != nullptr) {
			ButtonEventInfo *btnEventInfo = buttonEvent->buttonEventInfo;
			for (int i = 0; i < buttonEvent->buttonEventCount; i++) {
				delete[] btnEventInfo->buttonTypeValue;
				//List
				if (btnEventInfo->buttonEventType != nullptr) {
					ButtonEventType *btnEventType = btnEventInfo->buttonEventType;
					for (int i = 0; i < btnEventInfo->buttonEventTypeSize; i++) {
                        // TODO: CHeck if this is correct - looks a bit strange
                        // and gives a warning on mac:  cast to 'char *' from smaller integer
                        delete[](char *)(btnEventInfo->buttonEventType + i)->key;
                        delete[](btnEventInfo->buttonEventType + i)->value;
					}
				}
                delete[] btnEventInfo->buttonEventType;
			}
		}
		delete[] buttonEvent->buttonEventInfo;
	}
	delete buttonEvent;
}
// TODO: Complete

Napi::Value napi_GetButtonFocus(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::OBJECT,util::FUNCTION})) {
    const unsigned short buttonevent = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    Napi::Object buttonObject = info[1].As<Napi::Object>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    ButtonEvent * const rawButtonEvent = toCType(buttonevent, buttonObject);
    IF_LOG(plog::verbose) {
    //   LOG_VERBOSE << "napi_GetButtonFocus translated button event input argument into raw object : '" << toString(rawButtonEvent) << "'";
    }
    (new util::JAsyncWorker<void, void>(
      functionName,
      javascriptResultCallback,
      [functionName, buttonevent, rawButtonEvent](){
        Jabra_ReturnCode retv;
        if ((retv = Jabra_GetButtonFocus(buttonevent, rawButtonEvent)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }, [rawButtonEvent]() {
        if (rawButtonEvent) {
          Custom_FreeButtonEvents(rawButtonEvent);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
  
}
// TODO: Complete

Napi::Value napi_ReleaseButtonFocus(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::OBJECT,util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    Napi::Object buttonObject = info[1].As<Napi::Object>();
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    ButtonEvent * const rawButtonEvent = toCType(deviceId, buttonObject);
    IF_LOG(plog::verbose) {
    //   LOG_VERBOSE << "napi_GetButtonFocus translated button event input argument into raw object : '" << toString(rawButtonEvent) << "'";
    }
    (new util::JAsyncWorker<void, void>(
      functionName,
      javascriptResultCallback,
      [functionName, deviceId, rawButtonEvent](){
        Jabra_ReturnCode retv;
        if ((retv = Jabra_ReleaseButtonFocus(deviceId, rawButtonEvent)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }, [rawButtonEvent]() {
        if (rawButtonEvent) {
          Custom_FreeButtonEvents(rawButtonEvent);
        }
      }
    ))->Queue();
  }

  return env.Undefined();  
}

Napi::Value napi_SetDatetime(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::OBJECT, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());

    Napi::Object dateTimeJsObj = info[1].As<Napi::Object>();
  
    timedate_t dateTime;
    dateTime.sec = util::getObjInt32OrDefault(dateTimeJsObj, "sec", 0);
    dateTime.min = util::getObjInt32OrDefault(dateTimeJsObj, "min", 0);
    dateTime.hour = util::getObjInt32OrDefault(dateTimeJsObj, "hour", 0);
    dateTime.mday = util::getObjInt32OrDefault(dateTimeJsObj, "mday", 0);
    dateTime.mon = util::getObjInt32OrDefault(dateTimeJsObj, "mon", 0);
    dateTime.year = util::getObjInt32OrDefault(dateTimeJsObj, "year", 0);
    dateTime.wday = util::getObjInt32OrDefault(dateTimeJsObj, "wday", 0);    

    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId, dateTime](){ 
        Jabra_ReturnCode retv;                       
        if ((retv = Jabra_SetDateTime(deviceId, &dateTime)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_GetSupportedFeatures(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[1].As<Napi::Function>();

    (new util::JAsyncWorker<FeatureListCountPair, Napi::Array>(
      functionName, 
      javascriptResultCallback,
      [functionName, deviceId](){
        FeatureListCountPair flcPair;
        flcPair.featureList = Jabra_GetSupportedFeatures(deviceId, &flcPair.featureCount);
        return flcPair;
      },
      [](const Napi::Env& env, const FeatureListCountPair& flcPair) {

        Napi::Array jElements = Napi::Array::New(env);

        if (flcPair.featureList != nullptr) { 
          for (unsigned int i=0; i<flcPair.featureCount; ++i) {
            Napi::Number feature = Napi::Number::New(env, (uint32_t)flcPair.featureList[i]);
            jElements.Set(i, feature);
          }
        }

        return jElements;        
      },
      [](const FeatureListCountPair& flcPair) {
        if (flcPair.featureList != nullptr) {
          Jabra_FreeSupportedFeatures(flcPair.featureList);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
}

// TODO: Complete
/*
Napi::Value napi_GetEqualizerParameters(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::NUMBER, util::OBJECT,util::NUMBER,util::FUNCTION})) {
    const unsigned short deviceId = (unsigned short)(info[0].As<Napi::Number>().Int32Value());
    Napi::Object EqualizerBand = info[1].As<Napi::Object>();
	 const unsigned int nbands = (unsigned short)(info[2].As<Napi::Number>().Int32Value());
    Napi::Function javascriptResultCallback = info[3].As<Napi::Function>();

    EqualizerBand *rawEqualizerBand = toCType(deviceId, EqualizerBandObject);
    IF_LOG(plog::verbose) {
    //   LOG_VERBOSE << "napi_GetButtonFocus translated button event input argument into raw object : '" << toString(rawButtonEvent) << "'";
    }
    (new util::JAsyncWorker<void, void>(
      functionName,
      javascriptResultCallback,
      [functionName, deviceId, rawEqualizerBand,nbands](){
        Jabra_ReturnCode retv;
        if ((retv = Jabra_GetEqualizerParameters(deviceId, rawEqualizerBand,&nbands)) != Return_Ok) {
          util::JabraReturnCodeException::LogAndThrow(functionName, retv);
        }
      }, [rawEqualizerBand]() {
        if (rawEqualizerBand) {
         //Custom_FreeEqualizerBand(rawEqualizerBand);
        }
      }
    ))->Queue();
  }

  return env.Undefined();
  
}
*/