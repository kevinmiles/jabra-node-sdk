#include "stdafx.h"
#include <unordered_map>
#include <chrono>
#include "bt.h"

// -----------------------------------------------------------

/**
 * Holds all init state to pass between threads, including
 * all paramters to Jabra_Initialize, Jabra_SetAppID and
 * all event handler functions.
 */
class StateJabraInitialize {
  private:
  Napi::Env env;

  std::string appId;
  ThreadSafeCallback *initializedCallback;
  ThreadSafeCallback *firstScanDoneCallback;
  ThreadSafeCallback *attachedCallback;
  ThreadSafeCallback *deAttachedCallback;
  ThreadSafeCallback *buttonInDataTranslatedCallback;
  ThreadSafeCallback *devLogCallback;
  ThreadSafeCallback *batteryStatusCallback;
  ThreadSafeCallback *downloadFirmwareProgressCallback;
  ThreadSafeCallback *uploadProgressCallback;
  ThreadSafeCallback *registerPairingListCallback;
  ThreadSafeCallback *gNPButtonEventCallBack;

  std::string proxy;
  std::string baseUrl_capabilities;
  std::string baseUrl_fw;
  bool blockAllNetworkAccess;

  bool initializationStartedState;
  
  static void releaseCallback(ThreadSafeCallback* & callback) {
    if (callback) {
      ThreadSafeCallback* exception_safe_copy = callback;
      callback = nullptr;
      delete exception_safe_copy;
    }
  }

  public:
  StateJabraInitialize() : env(NULL), 
                           initializedCallback(nullptr),
                           firstScanDoneCallback(nullptr),
                           attachedCallback(nullptr),
                           deAttachedCallback(nullptr),
                           buttonInDataTranslatedCallback(nullptr),
                           devLogCallback(nullptr),
                           batteryStatusCallback(nullptr),
                           downloadFirmwareProgressCallback(nullptr),
                           uploadProgressCallback(nullptr),
                           registerPairingListCallback(nullptr),
                           gNPButtonEventCallBack(nullptr),
                           initializationStartedState(false) {}

  void set(const Napi::Env& _env,
           const std::string& _appId,
           ThreadSafeCallback* _initializedCallback,
           ThreadSafeCallback* _firstScanDoneCallback,
           ThreadSafeCallback* _attachedCallback,
           ThreadSafeCallback* _deAttachedCallback,
           ThreadSafeCallback* _buttonInDataTranslatedCallback,
           ThreadSafeCallback* _devLogCallback,
           ThreadSafeCallback* _batteryStatusCallback,
           ThreadSafeCallback* _downloadFirmwareProgressCallback,
           ThreadSafeCallback* _uploadProgressCallback,
           ThreadSafeCallback* _registerPairingListCallback,
           ThreadSafeCallback* _gNPButtonEventCallBack,
           const std::string& _proxy,
           const std::string& _baseUrl_capabilities,
           const std::string& _baseUrl_fw,
           bool _blockAllNetworkAccess
           ) {
      env = _env;
      appId = _appId;

      initializedCallback = _initializedCallback;
      firstScanDoneCallback = _firstScanDoneCallback;
      attachedCallback = _attachedCallback;
      deAttachedCallback = _deAttachedCallback;
      buttonInDataTranslatedCallback = _buttonInDataTranslatedCallback;
      devLogCallback = _devLogCallback;
      batteryStatusCallback = _batteryStatusCallback;
      downloadFirmwareProgressCallback = _downloadFirmwareProgressCallback;
      uploadProgressCallback = _uploadProgressCallback;
      registerPairingListCallback = _registerPairingListCallback;
      gNPButtonEventCallBack = _gNPButtonEventCallBack;

      proxy = _proxy;
      baseUrl_capabilities = _baseUrl_capabilities;
      baseUrl_fw = _baseUrl_fw;
      blockAllNetworkAccess = _blockAllNetworkAccess;

      initializationStartedState = true;
  }

  
  bool isInitializationStarted() {
    return initializationStartedState;
  }

  const std::string& getAppId() const {
    return appId;
  }

  ThreadSafeCallback * getInitializedCallback() {
    return initializedCallback;
  }

  ThreadSafeCallback * getFirstScanDoneCallback() {
    return firstScanDoneCallback;
  }

  ThreadSafeCallback * getAttachedCallback() {
    return attachedCallback;
  }

  ThreadSafeCallback * getDeAttachedCallback() {
    return deAttachedCallback;
  }

  ThreadSafeCallback * getButtonInDataTranslatedCallback() {
    return buttonInDataTranslatedCallback;
  }

  ThreadSafeCallback * getDevLogCallback() {
    return devLogCallback;
  }

  ThreadSafeCallback * getBatteryStatusCallback() {
    return batteryStatusCallback;
  }

  ThreadSafeCallback * getDownloadFirmwareProgressCallback() {
    return downloadFirmwareProgressCallback;
  }

  ThreadSafeCallback * getUploadProgressCallback() {
    return uploadProgressCallback;
  }

  ThreadSafeCallback * getRegisterPairingListCallback() {
    return registerPairingListCallback;
  }

  ThreadSafeCallback * getGNPButtonEventCallBack() {
    return gNPButtonEventCallBack;
  }


  std::string& getProxy() {
    return proxy;
  }

  std::string& getBaseUrl_fw() {
    return baseUrl_fw;
  }

  std::string& getBaseUrl_capabilities() {
    return baseUrl_capabilities;
  }

  bool getBlockAllNetworkAccess() {
    return blockAllNetworkAccess;
  }

  // Must be called to free resources (both to ensure no memory/resource leaks AND 
  // to make sure the node process won't block on exit).
  // Needs to be called from main thread.
  void done() {
    releaseCallback(initializedCallback);
    releaseCallback(firstScanDoneCallback);
    releaseCallback(attachedCallback);
    releaseCallback(deAttachedCallback);
    releaseCallback(buttonInDataTranslatedCallback);
    releaseCallback(devLogCallback);
    releaseCallback(batteryStatusCallback);
    releaseCallback(downloadFirmwareProgressCallback);
    releaseCallback(uploadProgressCallback);
    releaseCallback(registerPairingListCallback);
    releaseCallback(gNPButtonEventCallBack);
 
    // Re-allow init again.
    initializationStartedState = false;
  }
};

/**
 * Get ms since epoc.
 */
static std::uint64_t getTimeSinceEpoc() {
   return std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1);
}

/** 
 * As a hack, use global to pass state between thread and callbacks. Could be avoided if
 * the Jabra SDK c-type callbacks could be extended with a arbitary context parameter.
 */
static StateJabraInitialize state_Jabra_Initialize;

/**
 * Implements a combination of Jabra_Initialize, Jabra_SetAppID and all Jabra_RegisterXXX 
 * event handler setup functions. The implementation creates it's own thread to call 
 * all Jabra SDK functions. 
 * 
 * Important tempoary implementation note:
 * Callbacks are currently managed using a 3rd party napi-thread-safe-callback
 * library as the node-addon-api does not yet provide a c++ api for
 * cross thread callbacks. This 3rd-party implementation is not as portable
 * or future-proof n-api. Hence, once a official ThreadSafeFunction
 * (https://github.com/nodejs/node-addon-api/pull/442) is released 
 * the implementation should switch to the official 
 *
 */
Napi::Value napi_Initialize(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  const Napi::Env env = info.Env();
  
  LOG_DEBUG << functionName << " called";

  // Guard that we don't initialize twice. We use global memory for init so this could be a problem if allowed.
  if (state_Jabra_Initialize.isInitializationStarted()) {
    Napi::Error::New(env, "Jabra library already initialized or initialization already in progress").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (util::verifyArguments(__func__, info, { util::STRING, 
      util::FUNCTION, util::FUNCTION, util::FUNCTION, 
      util::FUNCTION, util::FUNCTION, util::FUNCTION,
      util::FUNCTION, util::FUNCTION, util::FUNCTION,
      util::FUNCTION, util::FUNCTION,
      util::OBJECT })) {

    int argNr = 0;

    std::string appId = info[argNr++].As<Napi::String>();
    auto initializedCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto firstScanDoneCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto attachedCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto deAttachedCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto buttonInDataTranslatedCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto devLogCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto batteryStatusCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto downloadFirmwareProgressCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto uploadProgressCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto registerPairingListCallback = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());
    auto gNPButtonEventCallBack = new ThreadSafeCallback(info[argNr++].As<Napi::Function>());

    Napi::Object configParams = info[argNr++].As<Napi::Object>();
    
    const std::string proxy = configParams.Has("proxy") ? (std::string)configParams.Get("proxy").As<Napi::String>() : "";
    const std::string baseUrl_capabilities =  configParams.Has("baseUrl_capabilities") ? (std::string)configParams.Get("baseUrl_capabilities").As<Napi::String>() : "";
    const std::string baseUrl_fw = configParams.Has("baseUrl_fw") ? (std::string)configParams.Get("baseUrl_fw").As<Napi::String>() : "";
    const bool blockAllNetworkAccess =  configParams.Has("blockAllNetworkAccess") ? (bool)configParams.Get("blockAllNetworkAccess").As<Napi::Boolean>() : false;

    state_Jabra_Initialize.set(env,
                               appId,
                               initializedCallback,
                               firstScanDoneCallback,
                               attachedCallback,
                               deAttachedCallback,
                               buttonInDataTranslatedCallback,
                               devLogCallback,
                               batteryStatusCallback,
                               downloadFirmwareProgressCallback,
                               uploadProgressCallback,
                               registerPairingListCallback,
                               gNPButtonEventCallBack,
                               proxy,
                               baseUrl_capabilities,
                               baseUrl_fw,
                               blockAllNetworkAccess);

    std::thread initThread([functionName](){
      try {                  
          ConfigParams_cloud configParams_cloud;
          configParams_cloud.blockAllNetworkAccess = state_Jabra_Initialize.getBlockAllNetworkAccess();
          configParams_cloud.proxy = state_Jabra_Initialize.getProxy().c_str();
          configParams_cloud.baseUrl_capabilities = state_Jabra_Initialize.getBaseUrl_capabilities().c_str();
          configParams_cloud.baseUrl_fw = state_Jabra_Initialize.getBaseUrl_fw().c_str();

          Config_params config;
          config.deviceCatalogue_params = nullptr;
          config.cloudConfig_params = &configParams_cloud;
          config.reserved2 = nullptr;

          LOG_DEBUG << "Calling Jabra_SetAppID";
          Jabra_SetAppID(state_Jabra_Initialize.getAppId().c_str());

          LOG_DEBUG << "Calling Jabra_Initialize";
          if (Jabra_Initialize([]() {  // First scan done.
              try {
                LOG_DEBUG << "First scan done";

                auto eventTime = getTimeSinceEpoc();

                auto firstScanCallback = state_Jabra_Initialize.getFirstScanDoneCallback();
                if (firstScanCallback) {
                  firstScanCallback->call([eventTime](Napi::Env env, std::vector<napi_value>& args) {
                    args = { Napi::Number::New(env, eventTime) };
                  });            
                }
              } catch (const std::exception &e) {       
                const std::string errorMsg = "Init firstScanDone callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "Init firstScanDone callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }
            }, [](Jabra_DeviceInfo _deviceInfo) { // attached            
              try {
                LOG_DEBUG << "Device #" << _deviceInfo.deviceID << " attached";

                auto eventTime = getTimeSinceEpoc();

                auto attachedCallback = state_Jabra_Initialize.getAttachedCallback();

                if (attachedCallback) {
                  // Make safe copy to avoid refering to memeory freed by Jabra_FreeDeviceInfo below.
                  ManagedDeviceInfo deviceInfo(_deviceInfo);                
                  Jabra_FreeDeviceInfo(_deviceInfo);

                  attachedCallback->call([deviceInfo, eventTime](Napi::Env env, std::vector<napi_value>& args) {
                      Napi::Object result = Napi::Object::New(env);
                      result.Set(Napi::String::New(env, "deviceID"), (Napi::Number::New(env, deviceInfo.deviceID)));
                      result.Set(Napi::String::New(env, "productID"), (Napi::Number::New(env, deviceInfo.productID)));
                      result.Set(Napi::String::New(env, "vendorID"), (Napi::Number::New(env, deviceInfo.vendorID)));
                      result.Set(Napi::String::New(env, "deviceName"), (Napi::String::New(env, deviceInfo.deviceName)));

                      result.Set(Napi::String::New(env, "usbDevicePath"), (Napi::String::New(env, deviceInfo.deviceName)));
                      result.Set(Napi::String::New(env, "parentInstanceId"), (Napi::String::New(env, deviceInfo.deviceName)));

                      result.Set(Napi::String::New(env, "errorStatus"), (Napi::Number::New(env, deviceInfo.errStatus)));
                      result.Set(Napi::String::New(env, "isDongleDevice"), (Napi::Boolean::New(env, deviceInfo.isDongle)));
                      result.Set(Napi::String::New(env, "dongleName"), (Napi::String::New(env, deviceInfo.dongleName)));
                      result.Set(Napi::String::New(env, "variant"), (Napi::String::New(env, deviceInfo.variant)));
                      result.Set(Napi::String::New(env, "ESN"), (Napi::String::New(env, deviceInfo.serialNumber)));

                      result.Set(Napi::String::New(env, "isInFirmwareUpdateMode"), (Napi::Boolean::New(env, deviceInfo.isInFirmwareUpdateMode)));
                      result.Set(Napi::String::New(env, "connectionType"), (Napi::Number::New(env, deviceInfo.deviceconnection)));
                      result.Set(Napi::String::New(env, "connectionId"), (Napi::Number::New(env, deviceInfo.connectionId)));
                      result.Set(Napi::String::New(env, "parentDeviceId"), (Napi::Number::New(env, deviceInfo.parentDeviceId)));

                      args = { result, Napi::Number::New(env, eventTime) };
                  });
                }
              } catch (const std::exception &e) {       
                const std::string errorMsg = "Init attached callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "Init attached callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }
            }, [](unsigned short deviceID) { // deattached 
              try {
                LOG_DEBUG << "Device #" << deviceID << " de-attached";

                auto eventTime = getTimeSinceEpoc();

                auto deAttachedCallback = state_Jabra_Initialize.getDeAttachedCallback();
                if (deAttachedCallback) {
                  deAttachedCallback->call([deviceID, eventTime](Napi::Env env, std::vector<napi_value>& args) {
                    args = { Napi::Number::New(env, deviceID), Napi::Number::New(env, eventTime) };
                  });
                }

                LOG_DEBUG << "Device de-attached";
              } catch (const std::exception &e) {       
                const std::string errorMsg = "Init deattached callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "Init deattached callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }
            }, [](unsigned short deviceID, unsigned short usagePage, unsigned short usage, bool buttonInData) { // Buttons raw.
                // Ignore - not used.
            },
            [](unsigned short deviceID, Jabra_HidInput translatedInData, bool buttonInData) { // Buttons translated
              try {
                LOG_VERBOSE << "Device #" << deviceID << " button press " << translatedInData << ", " << buttonInData;

                auto buttonInDataTranslatedCallback = state_Jabra_Initialize.getButtonInDataTranslatedCallback();
                if (buttonInDataTranslatedCallback) {
                  buttonInDataTranslatedCallback->call([deviceID, translatedInData, buttonInData](Napi::Env env, std::vector<napi_value>& args) {
                      args = { Napi::Number::New(env, deviceID), Napi::Number::New(env, (int)translatedInData), Napi::Boolean::New(env, buttonInData) };
                  });
                }

                LOG_VERBOSE << "Device button press finished";
              } catch (const std::exception &e) {       
                const std::string errorMsg = "Init translatedInData callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "Init translatedInData callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }
            },
            0, &config
          )) { // Init success
            LOG_DEBUG << "Jabra_Initialize successful - now registering callbacks";

            // Now that sdk is initialized, we should register all callbacks before we are done:

            Jabra_RegisterDevLogCallback([](unsigned short deviceID, char* _eventStr) {
              try {
                LOG_VERBOSE << "Jabra_RegisterDevLogCallback got eventStr " << _eventStr;

                auto devLogCallback = state_Jabra_Initialize.getDevLogCallback();

                // Make safe copy to avoid refering to memeory freed by Jabra_FreeString below.
                std::string eventStr(_eventStr);

                if (devLogCallback) {
                  devLogCallback->call([deviceID, eventStr](Napi::Env env, std::vector<napi_value>& args) {
                      args = { Napi::Number::New(env, deviceID), Napi::String::New(env, eventStr) };
                  });
                }
                Jabra_FreeString(_eventStr);
              } catch (const std::exception &e) {
                const std::string errorMsg = "DevLogCallback callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "DevLogCallback callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }              
            });

            Jabra_RegisterFirmwareProgressCallBack([](unsigned short deviceID, Jabra_FirmwareEventType type, Jabra_FirmwareEventStatus status, unsigned short percentage) {
              try {
                LOG_VERBOSE << "Jabra_RegisterFirmwareProgressCallBack got " << type << " " << status << " " << percentage;

                auto downloadFirmwareProgressCallback = state_Jabra_Initialize.getDownloadFirmwareProgressCallback();
                if (downloadFirmwareProgressCallback) {
                  downloadFirmwareProgressCallback->call([deviceID, type, status, percentage](Napi::Env env, std::vector<napi_value>& args) {
                      args = { Napi::Number::New(env, deviceID), Napi::Number::New(env, (int)type), Napi::Number::New(env, (int)status), Napi::Number::New(env, percentage) };
                  });
                }
              } catch (const std::exception &e) {
                const std::string errorMsg = "FirmwareProgress callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "FirmwareProgress callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }

            });

            Jabra_RegisterPairingListCallback([](unsigned short deviceID, Jabra_PairingList *lst) {
              try {
                LOG_VERBOSE << "Jabra_RegisterPairingListCallback called with " << (lst!=nullptr ? std::to_string(lst->count) : "null") << " pairings";

                ManagedPairingList mlst(*lst);

                auto registerPairingListCallback = state_Jabra_Initialize.getRegisterPairingListCallback();
                if (registerPairingListCallback) {
                  registerPairingListCallback->call([deviceID, mlst](Napi::Env env, std::vector<napi_value>& args) {
                      Napi::Object jlst = Napi::Object::New(env);
                      jlst.Set(Napi::String::New(env, "listType"), Napi::Number::New(env, mlst.listType));

                      Napi::Array jPairedDevices = Napi::Array::New(env);

                      int i = 0;
                      for (auto it = mlst.pairedDevice.begin(); it != mlst.pairedDevice.end(); it++) {
                        const ManagedPairedDevice& src =  *it;

                        Napi::Object jDev = Napi::Object::New(env);

                        jDev.Set(Napi::String::New(env, "deviceName"), Napi::String::New(env, src.deviceName));

                        std::string btAddrStr = toBTAddrString(src.deviceBTAddr.data(), src.deviceBTAddr.size());

                        jDev.Set(Napi::String::New(env, "deviceBTAddr"), Napi::String::New(env, btAddrStr));

                        jDev.Set(Napi::String::New(env, "isConnected"), Napi::Boolean::New(env, src.isConnected));

                        jPairedDevices.Set(i++, jDev);
                      }                    

                      jlst.Set(Napi::String::New(env, "pairedDevice"), jPairedDevices);
                      args = { Napi::Number::New(env, deviceID), jlst };
                  });
                }
                
                Jabra_FreePairingList(lst);
              } catch (const std::exception &e) {
                const std::string errorMsg = "Jabra_RegisterPairingListCallback callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "Jabra_RegisterPairingListCallback callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }
            });

            Jabra_RegisterForGNPButtonEvent([] (unsigned short deviceID, ButtonEvent *buttonEvent) {
              try {
                LOG_VERBOSE << "Jabra_RegisterForGNPButtonEvent called with " << (buttonEvent!=nullptr ? std::to_string(buttonEvent->buttonEventCount) : "null") << " button events";

                std::vector<ManagedButtonEventInfo> buttonInfos;
                      
                for (int i=0; i<buttonEvent->buttonEventCount; ++i) {
                  const ButtonEventInfo src = buttonEvent->buttonEventInfo[i];

                  const unsigned short buttonTypeKey = src.buttonTypeKey;
                  const std::string buttonTypeValue = std::string(src.buttonTypeValue);

                  for (int j=0; j<src.buttonEventTypeSize; ++j) {
                    ManagedButtonEventInfo e = { buttonTypeKey, buttonTypeValue, src.buttonEventType[j].key, std::string(src.buttonEventType[j].value) };
                    buttonInfos.push_back(e);
                  }
                }

                auto gNPButtonEventCallBack = state_Jabra_Initialize.getGNPButtonEventCallBack();
                if (gNPButtonEventCallBack) {
                  gNPButtonEventCallBack->call([deviceID, buttonInfos](Napi::Env env, std::vector<napi_value>& args) {
                      Napi::Array buttonEvents = Napi::Array::New(env);

                      std::unordered_map<unsigned short, Napi::Array *> targets;
                      for (auto itr = buttonInfos.begin(); itr != buttonInfos.end(); itr++) {
                        const ManagedButtonEventInfo& src = *itr;

                        if (targets.find(src.buttonTypeKey) == targets.end()) {
                           Napi::Array buttonEventInfos = Napi::Array::New(env);
                           targets.insert(std::pair<unsigned short, Napi::Array *>(src.buttonTypeKey, &buttonEventInfos));
                           
                           Napi::Object o = Napi::Object::New(env);
                           o.Set(Napi::String::New(env, "buttonTypeKey"), Napi::Number::New(env, src.buttonTypeKey));
                           o.Set(Napi::String::New(env, "buttonTypeValue"), Napi::String::New(env, src.buttonTypeValue));
                           o.Set(Napi::String::New(env, "buttonEventType"), buttonEventInfos);

                           buttonEvents.Set(buttonEvents.Length(), o);
                        } 
                        Napi::Array * target = targets[src.buttonTypeKey];
                        assert(target != nullptr);

                        Napi::Object keyValue = Napi::Object::New(env);
                        keyValue.Set(Napi::String::New(env, "key"), Napi::Number::New(env, src.key));
                        keyValue.Set(Napi::String::New(env, "value"), Napi::String::New(env, src.value));

                        target->Set(target->Length(), keyValue);
                      }

                      args = { Napi::Number::New(env, deviceID), buttonEvents };
                  });
                }
                
                Jabra_FreeButtonEvents(buttonEvent);
              } catch (const std::exception &e) {
                const std::string errorMsg = "Jabra_RegisterForGNPButtonEvent callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "Jabra_RegisterForGNPButtonEvent callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }
            });

            Jabra_RegisterBatteryStatusUpdateCallback([] (unsigned short deviceID, int levelInPercent, bool charging, bool batteryLow) {
              try {
                LOG_VERBOSE << "Jabra_RegisterBatteryStatusUpdateCallback got " << levelInPercent << " " << charging << " " << batteryLow;

                auto batteryStatusCallback = state_Jabra_Initialize.getBatteryStatusCallback();

                if (batteryStatusCallback) {
                  batteryStatusCallback->call([deviceID, levelInPercent, charging, batteryLow](Napi::Env env, std::vector<napi_value>& args) {
                      args = { Napi::Number::New(env, deviceID), Napi::Number::New(env, levelInPercent), Napi::Boolean::New(env, charging), Napi::Boolean::New(env, batteryLow) };
                  });
                }
              } catch (const std::exception &e) {
                const std::string errorMsg = "BatteryStatusUpdate callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "BatteryStatusUpdate callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }

            });

            Jabra_RegisterUploadProgress([] (unsigned short deviceID, Jabra_UploadEventStatus status, unsigned short percentage) {
              try {
                LOG_VERBOSE << "Jabra_RegisterUploadProgress got " << status << " " << percentage;

                auto uploadProgressCallback = state_Jabra_Initialize.getUploadProgressCallback();

                if (uploadProgressCallback) {
                  uploadProgressCallback->call([deviceID, status, percentage](Napi::Env env, std::vector<napi_value>& args) {
                      args = { Napi::Number::New(env, deviceID), Napi::Number::New(env, status), Napi::Number::New(env, percentage) };
                  });
                }
              } catch (const std::exception &e) {
                const std::string errorMsg = "RegisterUploadProgress callback failed: " + std::string(e.what());
                LOG_FATAL << errorMsg;
              } catch (...) {
                const std::string errorMsg = "RegisterUploadProgress callback failed failed with unknown exception";
                LOG_FATAL << errorMsg;
              }
            });

            // Finally, notify caller that init succeded:
            auto initCallback = state_Jabra_Initialize.getInitializedCallback();
            if (initCallback) {
              initCallback->call([](Napi::Env env, std::vector<napi_value>& args) {
                  args = { };
              });
            }
          } else { // Init failed.
            LOG_FATAL << "Jabra_Initialize failed";

            auto initCallback = state_Jabra_Initialize.getInitializedCallback();
            if (initCallback) {
              initCallback->error("Could not initialize jabra sdk");
            }
          }
      } catch (const std::exception &e) {       
        const std::string errorMsg = std::string(functionName) + " worker thread failed: " + std::string(e.what());
        LOG_FATAL << errorMsg;
      } catch (...) {
        const std::string errorMsg =  std::string(functionName) + " worker thread failed with unknown exception";
        LOG_FATAL << errorMsg;
      }
    });

    // Let thread safely live on after thead object goes out of scope (is destroyed).
    initThread.detach();

    LOG_DEBUG << functionName << " worker thread started";
  }

  return env.Null(); 
}

Napi::Value napi_UnInitialize(const Napi::CallbackInfo& info) {
  return util::JSyncWrapper<Napi::Value>(__func__, info, [](const char * const functionName, const Napi::CallbackInfo& info) -> Napi::Value {
    Napi::Env env = info.Env();
    bool retv = Jabra_Uninitialize();
    if (retv) {
      // Properly need to be called from main thread - so not sure this can be async if we should want this ?
      state_Jabra_Initialize.done();
    }
    return Napi::Boolean::New(env, retv);
  });
}

Napi::Value napi_ConnectToJabraApplication(const Napi::CallbackInfo& info)
{
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::STRING, util::STRING, util::FUNCTION})) {
    const std::string guid = info[0].As<Napi::String>();
    const std::string softphoneName = info[1].As<Napi::String>();    
    Napi::Function javascriptResultCallback = info[2].As<Napi::Function>();

    (new util::JAsyncWorker<bool, Napi::Boolean>(
      functionName, 
      javascriptResultCallback,
      [functionName, guid, softphoneName](){              
        return Jabra_ConnectToJabraApplication(guid.c_str(), softphoneName.c_str());
      }, 
      [](const Napi::Env& env, const bool result) {
        return Napi::Boolean::New(env, result);
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_DisconnectFromJabraApplication(const Napi::CallbackInfo& info)
{
  const char * const functionName = __func__;
  return util::SimpleAsyncFunction<Napi::Value, int>(functionName, info, 
    [functionName]() {
      Jabra_DisconnectFromJabraApplication();
      return 0;
    }, 
    [](const Napi::Env& env, const int dummy) { 
      return env.Null();
    }
  );
}

Napi::Value napi_SetSoftphoneReady(const Napi::CallbackInfo& info) 
{
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::BOOLEAN, util::FUNCTION})) {
    const bool isReady = info[0].As<Napi::Boolean>().ToBoolean();
    Napi::Function javascriptResultCallback = info[1].As<Napi::Function>();

    (new util::JAsyncWorker<void, void>(
      functionName, 
      javascriptResultCallback,
      [functionName, isReady](){              
        Jabra_SetSoftphoneReady(isReady);
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_IsSoftphoneInFocus(const Napi::CallbackInfo& info) 
{
  const char * const functionName = __func__;
  return util::SimpleAsyncFunction<Napi::Boolean, bool>(functionName, info, 
    [functionName]() {
      return Jabra_IsSoftphoneInFocus();
    }, 
    [](const Napi::Env& env, const bool result) {
       return Napi::Boolean::New(env, result);
    }
  );
}

Napi::Value napi_GetErrorString(const Napi::CallbackInfo& info)
{
  const char * const functionName = __func__;
  Napi::Env env = info.Env();

  if (util::verifyArguments(functionName, info, {util::STRING, util::STRING, util::FUNCTION})) {
    const Jabra_ErrorStatus errorCode = (Jabra_ErrorStatus)info[0].As<Napi::Number>().Uint32Value();  
    Napi::Function javascriptResultCallback = info[1].As<Napi::Function>();

    (new util::JAsyncWorker<const char *, Napi::String>(
      functionName, 
      javascriptResultCallback,
      [functionName, errorCode](){              
        return Jabra_GetErrorString(errorCode);
      }, 
      [](const Napi::Env& env, const char * result) {
        return Napi::String::New(env, result ? result : "");
      },
      [](const char * result) {
        // Assume error strings does not need to be freed.
      }
    ))->Queue();
  }

  return env.Undefined();
}

Napi::Value napi_GetVersion(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  return util::SimpleAsyncFunction<Napi::String, std::string>(functionName, info, [functionName]() {
    char buf[64];
    Jabra_ReturnCode retv;
    if ((retv = Jabra_GetVersion(&buf[0], sizeof(buf))) == Return_Ok) {
      return std::string(buf);
    } else {
      util::JabraReturnCodeException::LogAndThrow(functionName, retv);
      return std::string(); // Dummy return - avoid compiler warnings.
    }
  }, [](const Napi::Env& env, const std::string& cppResult) { return Napi::String::New(env, cppResult); });
}

/**
 * This function is for N-API experiments. Content may be deleted or replaced at will for new experiments.
 * 
 * Do not call this function in production - it is for experiments only.
 */
Napi::Value napi_SyncExperiment(const Napi::CallbackInfo& info) {
  const char * const functionName = __func__;
  const Napi::Env env = info.Env();
  
  /*

  ButtonEvent *buttonEvent = new ButtonEvent();
  buttonEvent->buttonEventCount = 2;
  buttonEvent->buttonEventInfo = new ButtonEventInfo[2];
  buttonEvent->buttonEventInfo[0].buttonEventType = new ButtonEventType[2];
  buttonEvent->buttonEventInfo[0].buttonEventType[0].key = 100;
  buttonEvent->buttonEventInfo[0].buttonEventType[0].value = "val1";
  buttonEvent->buttonEventInfo[0].buttonEventType[1].key = 101;
  buttonEvent->buttonEventInfo[0].buttonEventType[1].value = "val2";
  buttonEvent->buttonEventInfo[0].buttonEventTypeSize = 2;
  buttonEvent->buttonEventInfo[0].buttonTypeKey = 42;
  buttonEvent->buttonEventInfo[0].buttonTypeValue = "42value";
  buttonEvent->buttonEventInfo[1].buttonEventType = new ButtonEventType[1];
  buttonEvent->buttonEventInfo[1].buttonEventType[0].key = 102;
  buttonEvent->buttonEventInfo[1].buttonEventType[0].value = "val3";
  buttonEvent->buttonEventInfo[1].buttonEventTypeSize = 1;
  buttonEvent->buttonEventInfo[1].buttonTypeKey = 43;
  buttonEvent->buttonEventInfo[1].buttonTypeValue = "43value";

  std::vector<ManagedButtonEventInfo> buttonInfos;
                      
  for (int i=0; i<buttonEvent->buttonEventCount; ++i) {
    const ButtonEventInfo src = buttonEvent->buttonEventInfo[i];

    const unsigned short buttonTypeKey = src.buttonTypeKey;
    const std::string buttonTypeValue = std::string(src.buttonTypeValue);

    for (int j=0; j<src.buttonEventTypeSize; ++j) {
      ManagedButtonEventInfo e = { buttonTypeKey, buttonTypeValue, src.buttonEventType[j].key, std::string(src.buttonEventType[j].value) };
      buttonInfos.push_back(e);
    }
  }


  Napi::Array buttonEvents = Napi::Array::New(env);

  std::unordered_map<unsigned short, Napi::Array *> targets;
  for (auto itr = buttonInfos.begin(); itr != buttonInfos.end(); itr++) {
    const ManagedButtonEventInfo& src = *itr;

    if (targets.find(src.buttonTypeKey) == targets.end()) {
        Napi::Array buttonEventInfos = Napi::Array::New(env);
        targets.insert(std::pair<unsigned short, Napi::Array *>(src.buttonTypeKey, &buttonEventInfos));
        
        Napi::Object o = Napi::Object::New(env);
        o.Set(Napi::String::New(env, "buttonTypeKey"), Napi::Number::New(env, src.buttonTypeKey));
        o.Set(Napi::String::New(env, "buttonTypeValue"), Napi::String::New(env, src.buttonTypeValue));
        o.Set(Napi::String::New(env, "buttonEventType"), buttonEventInfos);

        buttonEvents.Set(buttonEvents.Length(), o);
    } 
    Napi::Array * target = targets[src.buttonTypeKey];
    assert(target != nullptr);

    Napi::Object keyValue = Napi::Object::New(env);
    keyValue.Set(Napi::String::New(env, "key"), Napi::Number::New(env, src.key));
    keyValue.Set(Napi::String::New(env, "value"), Napi::String::New(env, src.value));

    target->Set(target->Length(), keyValue);
  }

  return buttonEvents;
  */
 
  return env.Undefined();
}
