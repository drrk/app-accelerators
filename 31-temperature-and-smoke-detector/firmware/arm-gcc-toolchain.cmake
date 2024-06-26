# GNU ARM Toolchain
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR ARM)
set(ARM_TOOLCHAIN_PREFIX arm-none-eabi-)

# Determine OS Compatibility
if(MINGW OR CYGWIN OR WIN32)
    set(UTIL_SEARCH_CMD where)
elseif(UNIX OR APPLE)
    set(UTIL_SEARCH_CMD which)
endif()

# Capture Compiler and Binutils Path
execute_process(
        COMMAND ${UTIL_SEARCH_CMD} ${ARM_TOOLCHAIN_PREFIX}gcc
        OUTPUT_VARIABLE COMPILER_PATH
        OUTPUT_STRIP_TRAILING_WHITESPACE
)
get_filename_component(BINUTILS_PATH ${COMPILER_PATH} DIRECTORY)
message(STATUS "ARM Binutils Path: " ${BINUTILS_PATH})

# Declare Compilers
set(CMAKE_C_COMPILER ${COMPILER_PATH})
#set(CMAKE_CPP_COMPILER ${BINUTILS_PATH}/${ARM_TOOLCHAIN_PREFIX}g++)
set(CMAKE_ASM_COMPILER ${CMAKE_C_COMPILER})
set(CMAKE_TRY_COMPILE_TARGET_TYPE STATIC_LIBRARY)

# Declare Binutils
set(CMAKE_OBJCOPY ${BINUTILS_PATH}/${ARM_TOOLCHAIN_PREFIX}objcopy CACHE INTERNAL "objcopy tool")
set(CMAKE_OBJDUMP ${BINUTILS_PATH}/${ARM_TOOLCHAIN_PREFIX}objdump CACHE INTERNAL "objdump tool")
set(CMAKE_SIZE_UTIL ${BINUTILS_PATH}/${ARM_TOOLCHAIN_PREFIX}size CACHE INTERNAL "size tool")

# Establish Default Search Paths
set(CMAKE_FIND_ROOT_PATH ${BINUTILS_PATH})
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
