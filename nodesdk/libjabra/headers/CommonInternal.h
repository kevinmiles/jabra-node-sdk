#ifndef COMMONINTERNAL_H
#define COMMONINTERNAL_H

/* --------------------------------------------------------------------
 *
 *  GGGGGG  NN    N
 *  G       N N   N
 *  G  GGG  N  N  N - Audio
 *  G    G  N   N N
 *  GGGGGG  N    NN
 *
 *  Copyright (c) 2018, GN-Audio
 * -------------------------------------------------------------------- */

/**
 * @file CommonInternal.h
 * @brief Defines the Common interface of the Jabra SDK for internal usage.
 */

#include <stdint.h>

#if defined _WIN32 || defined __CYGWIN___
#define LIBRARY_API_INTERNAL extern "C" __declspec(dllexport)
#else
#ifdef __APPLE__
#ifdef __cplusplus
#define LIBRARY_API_INTERNAL extern "C" __attribute__ ((visibility ("default")))
#else
#define LIBRARY_API_INTERNAL __attribute__ ((visibility ("default")))
#endif
#elif defined(__linux__) && !defined(__ANDROID__)
#ifdef SDK_USE_INTERNAL_API
#ifdef __cplusplus
#define LIBRARY_API_INTERNAL extern "C" __attribute__ ((visibility ("default")))
#else
#define LIBRARY_API_INTERNAL __attribute__ ((visibility ("default")))
#include <stdbool.h>
#endif
#else
#define LIBRARY_API_INTERNAL
#endif
#elif defined(__linux__) && defined(__ANDROID__)

#ifdef __cplusplus
#define LIBRARY_API_INTERNAL extern "C" __attribute__ ((visibility ("default")))
#else
#define LIBRARY_API_INTERNAL __attribute__ ((visibility ("default")))
#include <stdbool.h>
#endif

#endif
#endif

LIBRARY_API_INTERNAL bool Jabra_Initialize_1(void(*FirstScanForDevicesDoneFunc)(),
	void(*DeviceAttachedFunc)(Jabra_DeviceInfo),
	void(*DeviceRemovedFunc)(unsigned short),
	void(*ButtonInDataRawHidFunc)(unsigned short, unsigned short, unsigned short, bool),
	void(*ButtonInDataTranslatedFunc)(unsigned short, Jabra_HidInput, bool),
	unsigned int instance,
	DeviceCatalogue_params* dcParams,
	ConfigParams_cloud* cloudParams);

LIBRARY_API_INTERNAL bool Jabra_Initialize_2(void(*FirstScanForDevicesDoneFunc)(),
	void(*DeviceAttachedFunc)(Jabra_DeviceInfo),
	void(*DeviceRemovedFunc)(unsigned short),
	void(*ButtonInDataRawHidFunc)(unsigned short, unsigned short, unsigned short, bool),
	void(*ButtonInDataTranslatedFunc)(unsigned short, Jabra_HidInput, bool),
	unsigned int instance,
	ConfigParams_cloud* cloudParams);

LIBRARY_API_INTERNAL bool Jabra_Initialize_3(void(*FirstScanForDevicesDoneFunc)(),
	void(*DeviceAttachedFunc)(Jabra_DeviceInfo),
	void(*DeviceRemovedFunc)(unsigned short),
	void(*ButtonInDataRawHidFunc)(unsigned short, unsigned short, unsigned short, bool),
	void(*ButtonInDataTranslatedFunc)(unsigned short, Jabra_HidInput, bool),
	unsigned int instance
);


/**
 * @brief Get the variant, which is in the format of TT-II, where TT is the
 * type of device (as defined in GNP) and II is the Identifier within the
 * type (as defined in GNP). Both represented in hex.
 * @param[in] deviceID ID for a specific device.
 * @param[in] variant Pointer to location where the variant is written. Must
 * be allocated by the caller.
 * @param[in] count Maximum number of characters to copy to variant.
 * @return Return_Ok if getting variant is successful.
 * @return Return_ParameterFail if setting parameter is wrong.
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_GetVariant(unsigned short deviceID, char* const variant, int count);

/**
 * @brief Get the product ID.
 * @param[in] deviceID ID for a specific device.
 * @param[in] pid Pointer to location where the product ID is written.
 * Must be allocated by the caller.
 * @param[in] count Maximum number of characters to copy to variant.
 * @return Return_Ok if getting variant is successful.
 * @return Return_ParameterFail if setting parameter is wrong.
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_GetPidAsString(unsigned short deviceID, char* const pid, int count);

/**
 * @brief Get the device features for a given product ID, variant and firmware.
 * If a nullptr is provided as firmware, the latest firmware stored in local
 * storage will be used. If no firmware exists in local storage, the latest
 * will be retrieved from the cloud. If no internet connection available, a
 * nullptr will be returned.
 * @param[in] pid Product ID (decimal).
 * @param[in] variant Variant of a product. Formatted as hex separated by a
 * dash, e.g. "01-4C".
 * @param[in] firmware Firmware version of a product. Formatted with digits
 * separated by dots, e.g. "1.2.3".
 * @param[out] count Number of device features
 * @return Device features if available. Nullptr otherwise.
 * @note As Memory is allocated through SDK for deviceFeatures, memory needs
 * to be freed by calling #Jabra_FreeSupportedFeatures.
 */
LIBRARY_API_INTERNAL DeviceFeature* Jabra_GetSupportedFeaturesByDeviceInfo(const char* pid, const char* variant, const char* firmware, unsigned int* count);

/**
 * @brief Get all the guids for the settings that is available for a given
 * device.
 * @param[in] pid Product ID (decimal).
 * @param[in] variant Variant of a product. Formatted as hex separated by a
 * dash, e.g. "01-4C".
 * @param[in] firmware Firmware version of a product. Formatted with digits
 * separated by dots, e.g. "1.2.3".
 * @param[out] count Number of guids.
 * @return Array of guids. Needs to be freed by calling #Jabra_FreeCharArray.
 */
LIBRARY_API_INTERNAL const char** Jabra_GetAvailableSettingGuidsByDeviceInfo(const char* pid, const char* variant, const char* firmware, unsigned int* count);

/**
 * @brief Returns the path to an image of the device.
 * @param[in] pid Product ID (decimal).
 * @param[in] variant Variant of a product. Formatted as hex separated by a
 * dash, e.g. "01-4C".
 * @param[in] firmware Firmware version of a product. Formatted with digits
 * separated by dots, e.g. "1.2.3".
 * @return Location of the thumbnail image. Deallocate using #Jabra_FreeString.
 */
LIBRARY_API_INTERNAL const char* Jabra_GetProductImagePathByDeviceInfo(const char* pid, const char* variant, const char* firmware);

/**
 * @brief Returns the path to an image of the device in thumbnail size.
 * @param[in] pid Product ID (decimal).
 * @param[in] variant Variant of a product. Formatted as hex separated by a
 * dash, e.g. "01-4C".
 * @param[in] firmware Firmware version of a product. Formatted with digits
 * separated by dots, e.g. "1.2.3".
 * @return Location of the thumbnail image. Deallocate using #Jabra_FreeString.
 */
LIBRARY_API_INTERNAL const char* Jabra_GetProductThumbnailImagePathByDeviceInfo(const char* pid, const char* variant, const char* firmware);

/**
 * @brief Request a named asset for the specified device.
 * @param[in] pid Product ID (decimal).
 * @param[in] variant Variant of a product. Formatted as hex separated by a
 * dash, e.g. "01-4C".
 * @param[in] firmware Firmware version of a product. Formatted with digits
 * separated by dots, e.g. "1.2.3".
 * @param[in] name The name of the requested asset - see developer doc for a
 * catalogue of possibly available assets. Note that availability may vary
 * across devices!.
 * @param[out] asset Address of a pointer to the returned asset. Caller must
 * free the allocated asset by calling #Jabra_FreeAsset.
 * @return Return_Ok if a valid asset was available (is then available through
 * (*asset)->...)
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_GetNamedAssetByDeviceInfo(const char* pid, const char* variant, const char* firmware, const char* name, CNamedAsset** asset);

/**
 * @brief Enable/disable setting protection.
 * @param[in] deviceID ID for a device.
 * @param[in] value Enable or disable setting protection (password).
 * @return Return_Ok if success, otherwise error code,
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_EnableSettingProtection(unsigned short deviceID, bool value);

/**
 * @brief Enable or disable firmware up-and-downgrade lock.
 * @param[in] deviceID ID for a device.
 * @param[in] enable set to true to enable or false to disable the lock.
 * @return Return_Ok if success otherwise error code.
 * @see Jabra_IsFirmwareLockEnabled
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_EnableFirmwareLock(unsigned short deviceID, bool enable);

typedef enum _VoiceAssistantEvent {
    VOICE_ASSISTANT_START   = 0x00,
    VOICE_ASSISTANT_CANCEL,
    VOICE_ASSISTANT_RELEASE,
    VOICE_ASSISTANT_AUDIO_READY_SCO,
    VOICE_ASSISTANT_AUDIO_READY_A2DP,
} VoiceAssistantEvent;


typedef void (*VoiceAssistantListener)(unsigned short deviceID, const VoiceAssistantEvent event);

/**
 * @brief Writes a key to the device indicating which voice assistant has been
 * selected.
 * @param[in] deviceID ID for a device.
 * @param[in] key Key to be persisted in the device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_VoiceAssistantLock(unsigned short deviceID, const char key);

/**
 * @brief Reads the key set in the device indicating which voice assistant has
 * been selected.
 * @param[in] deviceID ID for a device.
 * @param[out] key Key persisted in the device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_VoiceAssistantReadLock(unsigned short deviceID, char* key);

/**
 * @brief Reserves the voice assistant functionality. It means that the default
 * button functionality will be overridden (until released) and the client will
 * be notified about user actions (button presses).
 * @param[in] deviceID ID for a device.
 * @param[in] key Client key.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_VoiceAssistantReserve(unsigned short deviceID, const char key);

/**
 * @brief Entry-point for forwarding voice assistant events from the platform's
 * event-handling system to this method.
 * @param[in] deviceID ID for a device.
 * @param[in] event event raised by the device.
 * @param[in] key associated with event.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_OnVoiceAssistantEvent(unsigned short deviceID, const VoiceAssistantEvent event, const char key);

/**
 * @brief Forward released events from the platform's event-handling system to
 * this method.
 * @param[in] deviceID ID for a device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_OnVoiceAssistantReleased(unsigned short deviceID);

/**
 * @brief Adds a listener to be notified about voice assistant events.
 * @param[in] deviceID ID for a device.
 * @param[in] listener Listener to be notified about events.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_AddVoiceAssistantEventListener(unsigned short deviceID, VoiceAssistantListener listener);

/**
 * @brief Removes a listener to be notified about voice assistant events.
 * @param[in] deviceID ID for a device.
 * @param[in] listener Listener to be removed.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_RemoveVoiceAssistantEventListener(unsigned short deviceID, VoiceAssistantListener listener);

/**
 * @brief Invoke when voice reception is ready, or if voice assistant is
 * started on the host.
 * Requires Jabra_VoiceAssistantReserve to be called successfully first.
 * @param[in] deviceID ID for a device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @return Device_BadState if not reserved using #Jabra_VoiceAssistantReserve.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_VoiceAssistantStart(unsigned short deviceID);

/**
 * @brief Invoke to indicate that the voice activation session has ended and
 * the headset should no longer send a CANCEL event on user input.
 * Requires #Jabra_VoiceAssistantReserve to be called successfully first.
 * @param[in] deviceID ID for a device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @return Device_BadState if not reserved using #Jabra_VoiceAssistantReserve.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantRelease
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
*/
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_VoiceAssistantEnd(unsigned short deviceID);

/**
 * @brief Releases the reserved session and thus restores the functionality of
 * the button on the headset to default.
 * Requires #Jabra_VoiceAssistantReserve to be called successfully first.
 * @param[in] deviceID ID for a device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_OnVoiceAssistantAudioReadyEvent
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_VoiceAssistantRelease(unsigned short deviceID);

/**
 * @brief Entry-point for forwarding voice assistant audio ready events from
 * the platform's event-handling system to this method.
 * @param[in] deviceID Id for a device.
 * @param[in] event Audio ready event (either SCO or A2DP) raised by the device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @see Jabra_VoiceAssistantLock
 * @see Jabra_VoiceAssistantReadLock
 * @see Jabra_VoiceAssistantReserve
 * @see Jabra_OnVoiceAssistantEvent
 * @see Jabra_OnVoiceAssistantReleased
 * @see Jabra_AddVoiceAssistantEventListener
 * @see Jabra_RemoveVoiceAssistantEventListener
 * @see Jabra_VoiceAssistantStart
 * @see Jabra_VoiceAssistantEnd
 * @see Jabra_VoiceAssistantRelease
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_OnVoiceAssistantAudioReadyEvent(unsigned short deviceID, const VoiceAssistantEvent event);

/**
 * @brief Type used to specify which detailed information to obtain from the
 * device using the #Jabra_GetDetailedDeviceInformation.
 */
typedef enum _Jabra_DetailedDeviceInfoType {
  /** Get bootloader firmware versions for each CPU in the device. */
  BootloaderFirmware = 2000,
  /** Get the version of the language pack of the device. */
  LanguagePackVersion = 2001,
  /** Get the version of the tune pack of the base. */
  BaseTunePackVersion = 2002,
  /** Get the version of the graphics resource of the device. */
  GraphicsResourceVersion = 2003
} Jabra_DetailedDeviceInfoType;

/**
 * @brief Struct that carries detailed information about the device.
 */
typedef struct _Jabra_DetailedDeviceInfo {
  Jabra_DetailedDeviceInfoType type;
  union {
    struct {
      /** Map of addresses and firmware bootloader version. */
      const Map_Int_String* map;
    } bootloaderFirmware;
    struct {
      /** String containing the version of the language pack. */
      const char* version;
    } languagePackVersion;
    struct {
      /** String containing the version of the base tune pack. */
      const char* version;
    } baseTunePackVersion;
    struct {
      /** String containing the version of the graphics resource. */
      const char* version;
    } graphicsResourceVersion;
  } info;
} Jabra_DetailedDeviceInfo;

/**
 * @brief Gets detailed information about the device.
 * @param[in] deviceID ID of a device.
 * @param[in] type type of detailed information to get.
 * @return Pointer to #Jabra_DetailedDeviceInfo structure containing the
 * obtained device information. If the device is not known, null is
 * returned.
 * @note As Memory is allocated through SDK for #Jabra_DetailedDeviceInfo,
 * memory needs to be freed by calling #Jabra_FreeDetailedDeviceInformation.
 */
LIBRARY_API_INTERNAL const Jabra_DetailedDeviceInfo* Jabra_GetDetailedDeviceInformation(unsigned short deviceID, Jabra_DetailedDeviceInfoType type);

/**
 * @brief Free the list of detailed device information obtained by calling
 * #Jabra_GetDetailedDeviceInformation.
 * @param[in] info Pointer to information struct to free.
 */
LIBRARY_API_INTERNAL void Jabra_FreeDetailedDeviceInformation(const Jabra_DetailedDeviceInfo* info);

/**
 * @brief Gets the remote MMI application ID.
 * @param[in] deviceID ID of a device.
 * @param[out] mmiAppid Remote MMI application ID.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @note RemoteMMIv2 only.
 * @see Jabra_ReleaseRemoteMmiAppId
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_GetRemoteMmiAppId(unsigned short deviceID, uint8_t* mmiAppid);

/**
 * @brief Releases the remote MMI application ID.
 * @param[in] deviceID ID of a device.
 * @return Return_Ok if success.
 * @return Device_Unknown if the deviceID specified is not known.
 * @return Not_Supported if not supported by device.
 * @note RemoteMMIv2 only.
 * @see Jabra_GetRemoteMmiAppId
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_ReleaseRemoteMmiAppId(unsigned short deviceID);

/**
 * @brief Struct to carry a raw GNP message frame.
 */
typedef struct _GnpFrame {
  /** length of payload. */
  uint8_t len;

  /** GNP message as raw values. */
  uint8_t *payload;
} GnpFrame;

/**
 * @brief Sends a raw GNP message frame. The frame payload must fulfill the GNP
 * protocol.
 * @note this function can block for several seconds.
 * @param[in] deviceID deviceID ID for a device.
 * @param[in] gnpFrame frame to send.
 * @return the message frame response, in case of timeout nullptr is returned.
 * The frame response must be freed by calling Jabra_FreeRawGnpFrame.
 *
 * @code Example of a read GNP message
 *
 *     GnpFrame gnpFrame;
 *     gnpFrame.payload = new uint8_t[6];
 *     gnpFrame.len = 6;
 *     gnpFrame.payload[0] = 0x01; // destination
 *     gnpFrame.payload[1] = 0x00; // source
 *     gnpFrame.payload[2] = 0x02; // packet id (will be ignored i.e. it is overwritten)
 *     gnpFrame.payload[3] = 0x46; // attrib (2-bit MSB) 00b=event, 01b=read, 10b=write, 11b=reply
 *                                 // len (6-bit LSB)
 *     gnpFrame.payload[4] = 0x02; // command
 *     gnpFrame.payload[5] = 0x02; // subcommand/data
 *     GnpFrame* gnpFrameResponse = Jabra_SendRawGNPFrame(deviceSelected, &gnpFrame);
 *     ...
 *     Jabra_FreeRawGnpFrame(gnpFrameResponse);
 *
 */
LIBRARY_API_INTERNAL GnpFrame* Jabra_SendRawGnpFrame(unsigned short deviceID, const GnpFrame* gnpFrame);

/**
 * @brief Frees the GnpFrame structure.
 * @param[in] gnpFrame Frame to free.
 */
LIBRARY_API_INTERNAL void Jabra_FreeRawGnpFrame(const GnpFrame* gnpFrame);

/**
 * @brief Type definition of function pointer to use for
 * #Jabra_RegisterRawGnpEventCallback.
 */
typedef void(*GnpEventCallback)(unsigned short deviceID, const GnpFrame* gnpFrame);

/**
 * @brief Register for GNP event callback.
 * @param[in] callback Callback method called when GNP events are received.
 * @note The frame event must be freed by calling #Jabra_FreeRawGnpFrame.
 */
LIBRARY_API_INTERNAL void Jabra_RegisterRawGnpEventCallback(GnpEventCallback const callback);

/**
 * @brief Decode mSBC data to PCM
 * @param[in] handle the handle of the msbc decoder
 * @param[in] mSBC one complete mSBC frame for decoding (60 bytes incl sync header)
 * @param[in,out] pcmOut the decoded PCM data. On input this must be a buffer of at least 120 shorts owned by the caller. On return, it contains the PCM data
 * @param[in,out] pcmOutLength on input, holds the length of pcmOut[], on return, holds the actual number of samples in pcmOut[]
 * @return Jabra_ReturnCode::Return_Ok on success
 * @return Jabra_ReturnCode::Device_BadState if no data can be decoded
 * @return Jabra_ReturnCode::Return_ParameterFail if any of the inputs are null, or if *pcmOutLength is too small
 */
LIBRARY_API_INTERNAL Jabra_ReturnCode Jabra_Decode_mSBC(void *handle, uint8_t* mSBC, int16_t* pcmOut, uint16_t* pcmOutLength);

/**
 * @brief Create a handle for msbc decoder
 * @return The handle of msbc decoder
 */
LIBRARY_API_INTERNAL void *Jabra_Init_SBC();

/**
 * @brief Close the msbc handle
 * @param[in] phandle Handle created by Jabra_Init_SBC()
 */
LIBRARY_API_INTERNAL void Jabra_Close_SBC(void **phandle);

#endif /* COMMONINTERNAL_H */
