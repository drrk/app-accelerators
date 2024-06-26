// Copyright 2023 Blues Inc. All rights reserved.
// Use of this source code is governed by licenses granted by the
// copyright holder including that found in the LICENSE file.

// Firmware for a restroom servicing monitor ("rsm").

#include "rsm.h"

#include <framework.h>
#include <note.h>

#define STATE_SEND_RATING 0

static int appID = -1;

static void rsmPoll(int appID, int state, void *appCtx);
static void rsmISR(int appID, uint16_t pins, void *appCtx);
static void sendRating(uint8_t rating);

// The Sparrow reference node exposes GPIO pins A1, A2, and A3. This app
// connects each of these to a push button that corresponds to a different
// "rating" of restroom cleanliness. A1 is a bad rating, A2 is an ok rating, and
// A3 is a good rating.

// A1 corresponds to pin PB2 on the node's STM32 MCU.
#define BUTTON_BAD_PORT  A1_GPIO_Port
#define BUTTON_BAD_PIN   A1_Pin
#define BUTTON_BAD_IRQN  EXTI2_IRQn

// A2 -> PA10
#define BUTTON_OK_PORT   A2_GPIO_Port
#define BUTTON_OK_PIN    A2_Pin
#define BUTTON_OK_IRQN   EXTI15_10_IRQn

// A3 -> PA15
#define BUTTON_GOOD_PORT A3_GPIO_Port
#define BUTTON_GOOD_PIN  A3_Pin
#define BUTTON_GOOD_IRQN EXTI15_10_IRQn

#define ACTIVATION_PERIOD_SECS (60 * 24)
#define POLL_PERIOD_SECS 15

enum {
    NONE = 0,
    BAD  = 1,
    OK   = 2,
    GOOD = 3
};

typedef struct {
    // The rating is set in an ISR, so it needs to be marked volatile.
    volatile uint8_t rating;
} AppState;

static AppState appState = {0};

bool rsmInit()
{
    schedAppConfig config = {
        .name = "rsm",
        .activationPeriodSecs = ACTIVATION_PERIOD_SECS,
        .pollPeriodSecs = POLL_PERIOD_SECS,
        .activateFn = NULL,
        .interruptFn = rsmISR,
        .pollFn = rsmPoll,
        .responseFn = NULL,
        .appContext = &appState,
    };
    appID = schedRegisterApp(&config);
    if (appID < 0) {
        return false;
    }

    // All three buttons are configured to trigger an interrupt on a falling
    // edge, when they're pressed and the connection to the corresponding GPIO
    // pin is driven to GND. Each also has an internal pull-up so that when the
    // button isn't pressed, the logic level is high.
    HAL_GPIO_DeInit(BUTTON_BAD_PORT, BUTTON_BAD_PIN);
    GPIO_InitTypeDef gpioInit = {0};
    gpioInit.Pin = BUTTON_BAD_PIN;
    gpioInit.Mode = GPIO_MODE_IT_FALLING;
    gpioInit.Speed = GPIO_SPEED_FREQ_LOW;
    gpioInit.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(BUTTON_BAD_PORT, &gpioInit);
    HAL_NVIC_SetPriority(BUTTON_BAD_IRQN, 15, 0);
    HAL_NVIC_EnableIRQ(BUTTON_BAD_IRQN);

    HAL_GPIO_DeInit(BUTTON_OK_PORT, BUTTON_OK_PIN);
    gpioInit.Pin = BUTTON_OK_PIN;
    gpioInit.Mode = GPIO_MODE_IT_FALLING;
    gpioInit.Speed = GPIO_SPEED_FREQ_LOW;
    gpioInit.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(BUTTON_OK_PORT, &gpioInit);
    HAL_NVIC_SetPriority(BUTTON_OK_IRQN, 15, 0);
    HAL_NVIC_EnableIRQ(BUTTON_OK_IRQN);

    HAL_GPIO_DeInit(BUTTON_GOOD_PORT, BUTTON_GOOD_PIN);
    gpioInit.Pin = BUTTON_GOOD_PIN;
    gpioInit.Mode = GPIO_MODE_IT_FALLING;
    gpioInit.Speed = GPIO_SPEED_FREQ_LOW;
    gpioInit.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(BUTTON_GOOD_PORT, &gpioInit);
    HAL_NVIC_SetPriority(BUTTON_GOOD_IRQN, 15, 0);
    HAL_NVIC_EnableIRQ(BUTTON_GOOD_IRQN);

    return true;
}

static void rsmPoll(int appID, int state, void *appCtx)
{
    AppState *appState = (AppState *)appCtx;

    switch (state) {
        case STATE_ACTIVATED:
            schedSetState(appID, STATE_DEACTIVATED, "Nothing to do.");
            break;
        case STATE_SEND_RATING:
            atpMaximizePowerLevel();
            ledIndicateAck(1);
            sendRating(appState->rating);
            // Clear the rating so that we can process subsequent button
            // presses.
            appState->rating = NONE;
            schedSetCompletionState(appID, STATE_DEACTIVATED,
                STATE_DEACTIVATED);
            break;
    }

}

static void rsmISR(int appID, uint16_t pins, void *appCtx)
{
    AppState *appState = (AppState *)appCtx;

    uint8_t rating;
    if ((pins & BUTTON_BAD_PIN) != 0) {
        rating = BAD;
    }
    else if ((pins & BUTTON_OK_PIN) != 0) {
        rating = OK;
    }
    else if ((pins & BUTTON_GOOD_PIN) != 0) {
        rating = GOOD;
    }
    else {
        // Not an interrupt we care about.
        return;
    }

    if (appState->rating != NONE) {
        // Still processing a prior button press.
        return;
    }

    appState->rating = rating;
    schedActivateNowFromISR(appID, true, STATE_SEND_RATING);
}

static void sendRating(uint8_t rating)
{
    J *req = NoteNewRequest("note.add");
    if (req == NULL) {
        return;
    }
    JAddStringToObject(req, "file", "*#ratings.qo");

    const char *ratingStr = NULL;
    switch (rating) {
        case BAD:
            ratingStr = "bad";
            break;
        case OK:
            ratingStr = "ok";
            break;
        case GOOD:
            ratingStr = "good";
            break;
        default:
            APP_PRINTF("rsm: Undefined rating.\r\n");
            break;
    }
    if (ratingStr == NULL) {
        JDelete(req);
        return;
    }

    J *body = JCreateObject();
    if (body == NULL) {
        JDelete(req);
        return;
    }
    JAddStringToObject(body, "rating", ratingStr);
    JAddItemToObject(req, "body", body);
    JAddBoolToObject(req, "sync", true);

    APP_PRINTF("rsm: Sent %s rating.\r\n", ratingStr);

    noteSendToGatewayAsync(req, false);
}
