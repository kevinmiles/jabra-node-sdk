#include "napiutil.h"

namespace util {
    static inline std::string toString(FormalParameterType type) {
        switch (type) {
            case VOID: return "void"; break;
            case BOOLEAN: return "boolean"; break;
            case NUMBER: return "number"; break;
            // BIGINT: return "bigint"; break;
            case STRING: return "string"; break;
            case SYMBOL: return "symbol"; break;
            case ARRAYBUFFER: return "arraybuffer"; break;
            case TYPEDARRAY: return "typedarray"; break;
            case OBJECT: return "object"; break;
            case ARRAY: return "array"; break;
            case FUNCTION: return "function"; break;
            case PROMISE: return "promise"; break;
            case DATAVIEW: return"dataview"; break;
            case BUFFER: return "buffer"; break;
            case EXTERNAL: return "external"; break;
            case OBJECT_OR_STRING: return "object | string"; break;
            default: return "???"; break;
        }
    }


    static inline bool verifyValueType(const Napi::Value& value, FormalParameterType type) {
        switch (type) {
            case VOID: return value.IsNull() || value.IsUndefined(); break;
            case BOOLEAN: return value.IsBoolean(); break;
            case NUMBER: return value.IsNumber(); break;
            // BIGINT: return value.IsBigInt(); break;
            case STRING: return value.IsString(); break;
            case SYMBOL: return value.IsSymbol(); break;
            case ARRAYBUFFER: return value.IsArrayBuffer(); break;
            case TYPEDARRAY: return value.IsTypedArray(); break;
            case OBJECT: return value.IsObject(); break;
            case ARRAY: return value.IsArray(); break;
            case FUNCTION: return value.IsFunction(); break;
            case PROMISE: return value.IsPromise(); break;
            case DATAVIEW: return value.IsDataView(); break;
            case BUFFER: return value.IsBuffer(); break;
            case EXTERNAL: return value.IsExternal(); break;
            case OBJECT_OR_STRING: return value.IsObject() || value.IsString(); break;
            default: throw std::runtime_error(std::string("Unknown enum type value " + std::to_string(type)));
        }
    }

    bool verifyArguments(const char * const functionName, const Napi::CallbackInfo& info, std::initializer_list<FormalParameterType> expectedArgumentTypes) {
        const Napi::Env env = info.Env();

        if (info.Length() != expectedArgumentTypes.size()) {
            const std::string errMsg = "Wrong number of arguments to " + std::string(functionName) + " (got #" + std::to_string(info.Length()) + ",  expected #" + std::to_string( expectedArgumentTypes.size()) + ")";
            LOG_ERROR_(LOGINSTANCE) << errMsg;
            Napi::TypeError::New(env, errMsg).ThrowAsJavaScriptException();
            return false;
        }


        int j = 0;
        for (std::initializer_list<FormalParameterType>::iterator it=expectedArgumentTypes.begin(); it!=expectedArgumentTypes.end(); ++it) {
            if (!verifyValueType(info[j], *it)) {
                const std::string errMsg = "Wrong type of argument to " + std::string(functionName) + " #" +  std::to_string(j) + ". Got value not of excpected " + toString(*it) + " type)";
                LOG_ERROR_(LOGINSTANCE) << errMsg;
                Napi::TypeError::New(env, errMsg).ThrowAsJavaScriptException();
                return false;
            }
            ++j;
        }

        return true;
    }


    /**
     * Create a C-string from a std:string 
     */
    char * newCString(const std::string& src) {      
        char * cpy = new char[src.length() + 1];
        strncpy(cpy, src.c_str(), src.length());
        cpy[src.length()] = 0;

        return cpy;
    }

    /**
     * Create a C-string from a napi string/null object.
     */
    char * newCString(const Napi::Value& src) {
        if (src.IsString()) {
        Napi::String strSrc = src.As<Napi::String>();
        return newCString((std::string)strSrc);
        } else {
        return nullptr;
        }
    }
}
