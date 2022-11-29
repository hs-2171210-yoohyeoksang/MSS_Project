var port = 9001 // mosquitto의 디폴트 웹 포트
var client = null; // null이면 연결되지 않았음

function startConnect() { // 접속을 시도하는 함수
    clientID = "clientID-" + parseInt(Math.random() * 100); // 랜덤한 사용자 ID 생성

    // 사용자가 입력한 브로커의 IP 주소와 포트 번호 알아내기
    broker = document.getElementById("broker").value; // 브로커의 IP 주소

    // MQTT 메시지 전송 기능을 모두 가징 Paho client 객체 생성
    client = new Paho.MQTT.Client(broker, Number(port), clientID);

    // client 객체에 콜백 함수 등록
    client.onConnectionLost = onConnectionLost; // 접속이 끊어졌을 때 실행되는 함수 등록
    client.onMessageArrived = onMessageArrived; // 메시지가 도착하였을 때 실행되는 함수 등록

    // 브로커에 접속. 매개변수는 객체 {onSuccess : onConnect}로서, 객체의 프로퍼티는 onSuccess이고 그 값이 onConnect.
    // 접속에 성공하면 onConnect 함수를 실행하라는 지시
    client.connect({
        onSuccess: onConnect,
    });
}

var isConnected = false;

// 브로커로의 접속이 성공할 때 호출되는 함수
function onConnect() {
    isConnected = true;
    document.getElementById("messages").innerHTML += '<span>Connected!</span><br/>';
}

var topicSave;
function subscribe(topic) {
    if(client == null) return;
    if(isConnected != true) {
        topicSave = topic;
        window.setTimeout("subscribe(topicSave)", 500);
        return
    }
    // 접근감지가 시작되었음을 id가 message인 DIV에 출력
    if(topic=='ultrasonic')  // 토픽이 초음파일때
        document.getElementById("messages").innerHTML += '<span>거리 감지 시작' + '</span><br/>';
    else if(topic=='temperature')  // 토픽이 온도일때
        document.getElementById("messages").innerHTML += '<span>온도 감지 시작' + '</span><br/>';

    client.subscribe(topic); // 브로커에 subscribe
}
function publish(topic, msg) {
    if(client == null) return; // 연결되지 않았음
    client.send(topic, msg, 0, false);
}

function unsubscribe(topic) {
    if(client == null || isConnected != true) return;

    // 접근감지가 종료되었음을 id가 message인 DIV에 출력
    document.getElementById("messages").innerHTML += '<span>감지 종료' + '</span><br/>';

    client.unsubscribe(topic, null); // 브로커에 subscribe
}

// 접속이 끊어졌을 때 호출되는 함수
function onConnectionLost(responseObject) { // 매개변수인 responseObject는 응답 패킷의 정보를 담은 개체
    document.getElementById("messages").innerHTML += '<span>오류 : 접속 종료</span><br/>';
    if (responseObject.errorCode !== 0) {
        document.getElementById("messages").innerHTML += '<span>오류 : ' + + responseObject.errorMessage + '</span><br/>';
    }
}
let temp = 0; // 온도를 담기 위한 변수
// 메시지가 도착할 때 호출되는 함수

function onMessageArrived(msg) { // 매개변수 msg는 도착한 MQTT 메시지를 담고 있는 객체

    let write = document.getElementById("prompt");        // 웹 브라우저에 출력

    if(msg.destinationName=='temperature')
        temp = msg.payloadString          // 온도일때 temp에 온도값을 저장
    if(msg.destinationName=='ultrasonic'&&50<msg.payloadString)       // 어떤 접근도 없을때
    { 
        f_canvas = document.getElementById("myCanvas");
        context = f_canvas.getContext("2d");
        context.fillStyle="black";
        context.fillRect(0,0,500,300);           // 화면을 검게 만들어 카메라에 나타나는게 현재는 없음을 표현
    }
    if(msg.destinationName=='ultrasonic'&&10<msg.payloadString<=50)    // 누군가 접근중일때 화면 송출 시작(거리 50이하)
    {
        recognize();
        write.innerHTML = "<span style='color:black; font-size:50px;'>측정 대기</span>";
    }
    // 값 전달이 잘 되고 있는지 확인하기 위함
    console.log("onMessageArrived: " + msg.payloadString);
    console.log("onMessageArrived: " + msg.destinationName);

    if (msg.destinationName=='ultrasonic'&&msg.payloadString <= 10)   // 거리 감지와 동시에 거리가 10보다 작을때 체온 측정 가능
    {
        document.getElementById("messages").innerHTML += '<span>체온 출력' + '</span><br/>';
        if(temp < 38)     // 38도 이하 일시 출입 허가
            write.innerHTML = "<span style='color:chartreuse; font-size:50px;'>출입 허가 ("+Math.round(temp)+"도)</span>";
        else if (temp >= 38)        // 38도 이상 일시 출입 불가
            write.innerHTML = "<span style='color:red; font-size:50px;'>출입 불가 ("+Math.round(temp)+"도)</span>";
    }
    // 토픽 image가 도착하면 payload에 담긴 파일 이름의 이미지 그리기
    if(msg.destinationName == "image") {
        drawImage(msg.payloadString); // 메시지에 담긴 파일 이름으로 drawImage() 호출. drawImage()는 웹 페이지에 있음
    }
}

// disconnection 버튼이 선택되었을 때 호출되는 함수
function startDisconnect() {
    client.disconnect(); // 브로커에 접속 해제
    document.getElementById("messages").innerHTML += '<span>연결 종료</span><br/>';
}