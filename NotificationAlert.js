// -----定義-----
// 取得するシートを選択 - "<SHEETNAME>"を選択
const ss = SpreadsheetApp.getActive();
const sheet = ss.getSheetByName("<SHEETNAME>");
// webhookのurl
const webhook_url = "<WEBHOOKURL>"
// webhookの名前
const webhook_name = "<WEBHOOKNAME>"
// 指定する上限
const max_row = 30
// -------------

// main - 実行処理の主要部分
function main() {
  // date_match関数を実行し、日付判定を行う
  let number_row = date_match();
  // number_rowが"error"の時はエラーなのではじく
  if (number_row != "error") {
    // sheet_check関数を実行し、記入していない人のリストを取得する
    let null_list = sheet_check(number_row);
    // 記入していない人がいるとき(null_listが空でないとき)に実行
    if (null_list.length != 0) {
      // mention関数を実行し、discordにメンションできる形のデータリストを取得する
      let mention_list = mention(null_list);
      // data_set関数を実行し、payloadできるデータセットを作成する
      let payload = data_set(mention_list);
      // postDiscord関数を実行する
      postDiscord(payload);
    }
    else {
      console.info("全員日程表を記入しています。");
    }
  }
  else {
    console.info("date_match関数でエラーが発生しています。エラーメッセージを解析してください。");
  }
}

// 日付判定 - 指定日時の前日になったら、指定日時の行数を返す 何らかのエラーが発生した場合、"error"を返す。
function date_match() {
  // 今日の日時を取得
  let today = new Date(); today.setHours(0,0,0,0);
  // 年と月を取得し、日を取得及び1日加算する
  let year = today.getFullYear();
  let month = today.getMonth();
  let date = today.getDate()+1;
  // 年月日+1を格納する
  let tomorrow = new Date(year, month, date);

  // A2から順番に日時を取得し、一致しているか調べ、一致していたらループから抜け出す
  for (row = 2; true; row++) {
    // A列のrow行目を取得する
    let date = sheet.getRange(row,1).getValue();
    if (new Date(date).getTime() == new Date(tomorrow).getTime()) {
      break;
    }
    else if (row >= max_row) {
      console.warn("システムがスタックオーバーフローしたか、設定日時に達していないもしくは、多すぎます！！");
      row = "error";
      break;
    }
  }
  console.info("一致した行数:"+row+"行目");
  return row;
}

// シート記入がされているかチェックし、記入していない人をlist型に記録して返す
function sheet_check(row) {
  // 記入していない人リスト
  let null_list_name = [];
  let null_list_cell = [];
  // 指定日時の出席を取得する ※二重配列
  // [[指定行, 列(B列), 行数(1行分), 列数(B~Jの9列分)]]
  let values = sheet.getRange(row, 2, 1, 9).getValues();
  for (i = 0; i < 9; i++) {
    if (values[0][i] == "null") {
      // 行数指定用の変数
      let column = i + 2;
      // 誰が記入していないか(null)を調べる
      let who_is_null_name = sheet.getRange(1, column).getValue();
      // 列数記録用
      let who_is_null_cell = column;
      // 記入していない人リストに記入していない人の名前を追加していく
      null_list_name.push(who_is_null_name);
      // 列数記録用
      null_list_cell.push(who_is_null_cell);
    }
  }
  if (null_list_name.length || null_list_cell.length != 0) {
    console.info("記入していない人:"+null_list_name+"\n列数:"+null_list_cell);
  }
  return null_list_cell;
}

// メンションを作成する <@NUMBER>の形でリスト型で返す
function mention(null_list) {
  // 空のリストを作成
  let mention_list = [];
  // 引数のリストの長さを確認する
  let list_length = null_list.length;
  for (i = 0; i < list_length; i++) {
    switch (null_list[i]) {
      case 2:
        mention_list.push("<@NUMBER>");
      break;
      /* コピー用 上記と同じように指定したい人数だけ数を増やしていってください。 <COLUMN>は一致させたい人の列数と一致させてください。
      case <COLUMN>:
        mention_list.push("<@NUMBER>");
      break;
      */
      // 通常はnull_listが空(0人)の時はこの関数以下は実行されないはずなのでバグの可能性が高い
      default:
        console.error("名称等が間違っている可能性があります！");
    }
  }
  console.info("メンションid:"+mention_list);
  return mention_list;
}

// データセットを作成
function data_set(mention_list) {
  let content = "以下の人はまだ日程表を記入していません！\r早く決めろばか！！\r"+mention_list;
  let payload = {
    "username": webhook_name,
    "content": content,
    "tts": false
  }
  console.info("discordチャンネルにメッセージが送信されました。");
  return payload;
}

// Discordへデータリストを送信
function postDiscord(payload) {
  UrlFetchApp.fetch(webhook_url, {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
  });
}