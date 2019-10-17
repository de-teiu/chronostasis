import "../scss/index.scss";
import 'sanitize.css';
import $ from "jquery";
import BigNumber from "bignumber.js";

$(()=>{
    const KEY_DEFAULT_HOURS = "KEY_DEFAULT_HOURS";

    let timer = null;
    $("#btn-update").on("click",function(){
        const dayLength = $("#inp-daylength").val();
        if(hasError(dayLength)){
            setVisibility($("#block-error"),true);
            return;
        }
        setVisibility($("#block-error"),false);
        clearInterval(timer);
        const dayDuration = calculateDayDuration(dayLength);
        localStorage.setItem(KEY_DEFAULT_HOURS,dayLength);
        timer = setInterval(() => {
            recalculate(dayDuration);
        },100);
    });

    const settings = localStorage.getItem(KEY_DEFAULT_HOURS);
    const defaultHours = (!settings) ? 24 : settings;
    $("#inp-daylength").val(defaultHours);
    $("#btn-update").click();
});

/**
 * 入力エラーチェック
 * @param {*} value 入力値
 * @returns 入力エラーがあればtrue
 */
const hasError = (value) => {
    if(!value){
        return true;
    }

    if(isNaN(value)){
        return true;
    }
    const numVal = Number(value);
    if(numVal < 1 || numVal > 1440 ){
        return true;
    }

    return false;
};

/**
 * 1日の長さを算出
 * @param {*} hour 1日の長さ(時)
 * @returns 1日の長さ(時)、1時間の長さ(分)、延長時間
 */
const calculateDayDuration = (hour) => {
    //本来の1日の長さ(分)
    const normalDayDuration = BigNumber(60).times(24);
    //1時間の長さ(分)
    const hourDuration = normalDayDuration.div(hour).integerValue(BigNumber.ROUND_DOWN);
    //延長時間(分)
    const extraTime = normalDayDuration.minus(hourDuration.times(hour));

    //1時間の単位表示を更新
    $("#txt-unit").text(hourDuration);
    //延長時間の表示を更新
    setVisibility($("#txt-extra-remarks"),extraTime > 0);
    $("#txt-extra").text(extraTime);

    return {
        hour: hour,
        hourDuration: hourDuration,
        extraTime: extraTime,
    }
};

/**
 * 現在時刻を再計算する
 * @param {*} dayDuration 時分の長さ定義
 */
const recalculate = (dayDuration) => {
    
    //現在時刻を取得(分)
    const now = new Date();
    const minutes = BigNumber(now.getHours()).times(60).plus(now.getMinutes());
    //延長時間に突入しているか判定
    const isInExtraTime = minutes.div(dayDuration.hourDuration).toNumber() > dayDuration.hour;
    
    //算出した1時間の長さと延長時間から、変換後の現在時刻を算出
    if(isInExtraTime){
        const convertedHours = dayDuration.hour;
        const convertedMinutes = BigNumber(minutes).minus(dayDuration.hourDuration.times(dayDuration.hour));
        const seconds = now.getSeconds();
        //画面表示を更新
        updateView(convertedHours,convertedMinutes,seconds,isInExtraTime);
    } else {
        const convertedHours = minutes.div(dayDuration.hourDuration).integerValue(BigNumber.ROUND_DOWN);
        const convertedMinutes = minutes.modulo(dayDuration.hourDuration);
        const seconds = now.getSeconds();
        //画面表示を更新
        updateView(convertedHours,convertedMinutes,seconds,isInExtraTime);
    }
};

/**
 * 画面表示更新
 * @param {*} convertedHours 時
 * @param {*} convertedMinutes 分
 * @param {*} seconds 秒
 * @param {*} isInExtraTime 延長時間突入判定
 */
const updateView = (convertedHours,convertedMinutes,seconds,isInExtraTime) => {
    $("#txt-hours").text(convertedHours);
    $("#txt-minutes").text(convertedMinutes);
    $("#txt-seconds").text(seconds);
    setVisibility($("#txt-extra-title"),isInExtraTime);
    if(isInExtraTime){
        $("#block-current").addClass("in-extra");
    }else{
        $("#block-current").removeClass("in-extra");
    }
    
};

/**
 * 要素の表示切り替え
 * @param {*} obj jQueryオブジェクト
 * @param {*} visibility 表示可否
 */
const setVisibility = (obj,visibility) => {
    obj.css("visibility",(visibility) ? "visible" : "hidden");
};

//PWA化のため、ServiceWorkerを登録
const swName = "/service-worker.js";
navigator.serviceWorker.register(swName);