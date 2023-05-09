import assert = require('assert');
import { Enveloper } from '../../models/enveloper';

suite('Enveloper', () => {

	test('Оборачиваем в конверт xml событие из EventViewer-а с артефактами копирования', async () => {
		const xmlEvent = 
`- <Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
- <System>
  <Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-a5ba-3e3b0328c30d}" />
  <EventID>4662</EventID>
  <Version>0</Version>
  <Level>0</Level>
  <Task>12804</Task>
  <Opcode>0</Opcode>
  <Keywords>0x8020000000000000</Keywords>
  <TimeCreated SystemTime="2021-01-23T15:16:51.5407675Z" />
  <EventRecordID>95430729</EventRecordID>
  <Correlation ActivityID="{7bf708e0-5d4b-1572-3109-f77b4b5dd901}" />
  <Execution ProcessID="720" ThreadID="33996" />
  <Channel>Security</Channel>
  <Computer>ivanov-pc.example.com</Computer>
  <Security />
</System>
- <EventData>
  <Data Name="SubjectUserSid">S-1-5-18</Data>
  <Data Name="SubjectUserName">IVANOV-PC$</Data>
  <Data Name="SubjectDomainName">EXAMPLE</Data>
  <Data Name="SubjectLogonId">0x3e7</Data>
  <Data Name="ObjectServer">WMI</Data>
  <Data Name="ObjectType">WMI Namespace</Data>
  <Data Name="ObjectName">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
  <Data Name="OperationType">Object Access</Data>
  <Data Name="HandleId">0x0</Data>
  <Data Name="AccessList">%%1552
			  </Data>
  <Data Name="AccessMask">0x1</Data>
  <Data Name="Properties">-</Data>
  <Data Name="AdditionalInfo">Local Read (ConnectServer)</Data>
  <Data Name="AdditionalInfo2">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
</EventData>
</Event>`;

		const envelopedEvent = await Enveloper.addEnvelope(xmlEvent, "application/x-pt-eventlog");
		const json = JSON.parse(envelopedEvent);

		assert.ok(json);

		assert.ok(json.body);
		assert.ok(json.recv_time);
		assert.ok(json.uuid);

		assert.strictEqual(json.recv_ipv4, "127.0.0.1");
		assert.strictEqual(json.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(json.tag, "some_tag");
		assert.strictEqual(json.mime, "application/x-pt-eventlog");
		assert.strictEqual(json.normalized, false);
		assert.strictEqual(json.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(json.type, "raw");
	});

	test('Оборачиваем в конверт xml событие из EventViewer-а без артефактов копирования', async () => {
		const xmlEvent = 
`<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
<System>
	<Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-a5ba-3e3b0328c30d}" />
	<EventID>4662</EventID>
	<Version>0</Version>
	<Level>0</Level>
	<Task>12804</Task>
	<Opcode>0</Opcode>
	<Keywords>0x8020000000000000</Keywords>
	<TimeCreated SystemTime="2021-01-23T15:16:51.5407675Z" />
	<EventRecordID>95430729</EventRecordID>
	<Correlation ActivityID="{7bf708e0-5d4b-1572-3109-f77b4b5dd901}" />
	<Execution ProcessID="720" ThreadID="33996" />
	<Channel>Security</Channel>
	<Computer>ivanov-pc.example.com</Computer>
	<Security />
</System>
<EventData>
	<Data Name="SubjectUserSid">S-1-5-18</Data>
	<Data Name="SubjectUserName">IVANOV-PC$</Data>
	<Data Name="SubjectDomainName">EXAMPLE</Data>
	<Data Name="SubjectLogonId">0x3e7</Data>
	<Data Name="ObjectServer">WMI</Data>
	<Data Name="ObjectType">WMI Namespace</Data>
	<Data Name="ObjectName">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
	<Data Name="OperationType">Object Access</Data>
	<Data Name="HandleId">0x0</Data>
	<Data Name="AccessList">%%1552
				</Data>
	<Data Name="AccessMask">0x1</Data>
	<Data Name="Properties">-</Data>
	<Data Name="AdditionalInfo">Local Read (ConnectServer)</Data>
	<Data Name="AdditionalInfo2">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
</EventData>
</Event>`;

		const envelopedEvent = await Enveloper.addEnvelope(xmlEvent, "application/x-pt-eventlog");
		const json = JSON.parse(envelopedEvent);

		assert.ok(json);

		assert.ok(json.body);
		assert.ok(json.recv_time);
		assert.ok(json.uuid);

		assert.strictEqual(json.recv_ipv4, "127.0.0.1");
		assert.strictEqual(json.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(json.tag, "some_tag");
		assert.strictEqual(json.mime, "application/x-pt-eventlog");
		assert.strictEqual(json.normalized, false);
		assert.strictEqual(json.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(json.type, "raw");
	});

	test('Добавление одного json-события в конверт', async () => {

		const compressedRawEvents = 
		`{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"MSSQLSERVER"},"EventID":{"text":"18453","Qualifiers":"16384"},"Level":"0","Task":"4","Keywords":"0xa0000000000000","TimeCreated":{"SystemTime":"2022-06-24T15:50:01.779402300Z"},"EventRecordID":"6490211","Channel":"Application","Computer":"dc.domain.com","Security":{"UserID":"S-1-5-21-231231-123123-123123-123123"}},"EventData":{"Data":["DOMAIN\\Svc"," [CLIENT: 12.14.32.242]"],"Binary":"436127235725400025130510230612034601230460103460713047013047010234070123"}}}`;
		
		const envelopedRawEvents = await Enveloper.addEnvelope(compressedRawEvents, "application/x-pt-eventlog");

		const actualObject = JSON.parse(envelopedRawEvents);

		assert.strictEqual(actualObject.body, "{\"Event\":{\"xmlns\":\"http://schemas.microsoft.com/win/2004/08/events/event\",\"System\":{\"Provider\":{\"Name\":\"MSSQLSERVER\"},\"EventID\":{\"text\":\"18453\",\"Qualifiers\":\"16384\"},\"Level\":\"0\",\"Task\":\"4\",\"Keywords\":\"0xa0000000000000\",\"TimeCreated\":{\"SystemTime\":\"2022-06-24T15:50:01.779402300Z\"},\"EventRecordID\":\"6490211\",\"Channel\":\"Application\",\"Computer\":\"dc.domain.com\",\"Security\":{\"UserID\":\"S-1-5-21-231231-123123-123123-123123\"}},\"EventData\":{\"Data\":[\"DOMAIN\\Svc\",\" [CLIENT: 12.14.32.242]\"],\"Binary\":\"436127235725400025130510230612034601230460103460713047013047010234070123\"}}}");
		assert.ok(actualObject.recv_time);
		assert.ok(actualObject.uuid);

		assert.strictEqual(actualObject.recv_ipv4, "127.0.0.1");
		assert.strictEqual(actualObject.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.tag, "some_tag");
		assert.strictEqual(actualObject.mime, "application/x-pt-eventlog");
		assert.strictEqual(actualObject.normalized, false);
		assert.strictEqual(actualObject.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.type, "raw");
	});


	test('Добавление двух json-событий в конверт', async () => {

		const compressedRawEvents = 
`{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"MSSQLSERVER"},"EventID":{"text":"18453","Qualifiers":"16384"},"Level":"0","Task":"4","Keywords":"0xa0000000000000","TimeCreated":{"SystemTime":"2022-06-24T15:50:01.779402300Z"},"EventRecordID":"6490211","Channel":"Application","Computer":"dc.domain.com","Security":{"UserID":"S-1-5-21-1023000730-721111127-3110000192-11233"}},"EventData":{"Data":["DOMAIN\\Svc"," [CLIENT: 10.10.56.31]"],"Binary":"436127235725400025130510230612034601230460103460713047013047010234070123"}}}
{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"MSSQLSERVER"},"EventID":{"text":"18453","Qualifiers":"16384"},"Level":"0","Task":"4","Keywords":"0xa0000000000000","TimeCreated":{"SystemTime":"2022-06-24T15:50:01.779402300Z"},"EventRecordID":"6490211","Channel":"Application","Computer":"dc.domain.com","Security":{"UserID":"S-1-5-21-1023000730-721111127-3110000192-11233"}},"EventData":{"Data":["DOMAIN\\Svc"," [CLIENT: 10.10.56.31]"],"Binary":"436127235725400025130510230612034601230460103460713047013047010234070123"}}}`;
		
		const envelopedRawEvents = await Enveloper.addEnvelope(compressedRawEvents, "application/x-pt-eventlog");

		const envelopedRawEventsArray = envelopedRawEvents.split("\n");
		assert.ok(envelopedRawEventsArray.length == 2);

		const firstEvent = JSON.parse(envelopedRawEventsArray[0]);

		assert.ok(firstEvent.body);
		assert.ok(firstEvent.recv_time);
		assert.ok(firstEvent.uuid);

		assert.strictEqual(firstEvent.recv_ipv4, "127.0.0.1");
		assert.strictEqual(firstEvent.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(firstEvent.tag, "some_tag");
		assert.strictEqual(firstEvent.mime, "application/x-pt-eventlog");
		assert.strictEqual(firstEvent.normalized, false);
		assert.strictEqual(firstEvent.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(firstEvent.type, "raw");

		const secondEvent = JSON.parse(envelopedRawEventsArray[1]);

		assert.ok(secondEvent.body);
		assert.ok(secondEvent.recv_time);
		assert.ok(secondEvent.uuid);

		assert.strictEqual(secondEvent.recv_ipv4, "127.0.0.1");
		assert.strictEqual(secondEvent.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(secondEvent.tag, "some_tag");
		assert.strictEqual(secondEvent.mime, "application/x-pt-eventlog");
		assert.strictEqual(secondEvent.normalized, false);
		assert.strictEqual(secondEvent.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(secondEvent.type, "raw");
	});

	test('Добавление конверта для текстового события', async () => {

		const compressedRawEvents = `2022-07-20 07:03:38 W3SVC2 mail-srv 10.0.25.16 POST /Microsoft-Server-ActiveSync/Proxy/default.eas User=user@domain.com&DeviceId=JUQGGDFCDD29R3H003TJA63E10&DeviceType=iPhone&Cmd=Ping&Log=SC1:1_PrxFrom:10.0.22.211_Ver1:161_HH:mail.domain.com_SmtpAdrs:User%domain.com_Hb:600_Rto:2_Cpo:656_Fet:600000_Mbx:mail.domain.com_Cafe:MBX-SRV.DOMAIN.COM_Dc:dc-srv.domain.com_Throttle:0_SBkOffD:L%2f-470_TmRcv:06:53:38.4480003_TmSt:06:53:38.4519947_TmFin:06:53:38.4519947_TmCmpl:07:03:38.440522_TmCnt:07:03:37.7834641_Budget:(A)Owner%3aS-1-5-21-1023191730-727829927-3110000192-14176%5FJUQGGDFCDD29R3H003TJA63E10%5FiPhone%2cConn%3a0%2cMaxConn%3a10%2cMaxBurst%3a480000%2cBalance%3a480000%2cCutoff%3a600000%2cRechargeRate%3a1800000%2cPolicy%3aGlobalThrottlingPolicy%5F5c9d3d31-7f05-4e14-b8f8-05780608b52f%2cIsServiceAccount%3aFalse%2cLiveTime%3a00%3a00%3a30.6952647%3b(D)Owner%3aS-1-5-21-1023191730-727829927-3110000192-14176%5FJUQGGDFCDD29R3H003TJA63E10%5FiPhone%2cConn%3a0%2cMaxConn%3a10%2cMaxBurst%3a480000%2cBalance%3a480000%2cCutoff%3a600000%2cRechargeRate%3a1800000%2cPolicy%3aGlobalThrottlingPolicy%5F5c9d3d31-7f05-4e14-b8f8-05780608b52f%2cIsServiceAccount%3aFalse%2cLiveTime%3a00%3a00%3a00.6580618_ActivityContextData:ActivityID%3d0483abd0-f1d6-44e7-bfe8-e951e242b7bd%3bI32%3aADS.C%5bdc-srv%5d%3d1%3bF%3aADS.AL%5bdc-srv%5d%3d1.62791%3bI32%3aATE.C%5bdc.domain.com%5d%3d1%3bF%3aATE.AL%5bdc.domain.com%5d%3d0%3bS%3aWLM.Bal%3d480000%3bS%3aWLM.BT%3dEas_ 444 DOMAIN\\USER 23.12.22.38 HTTP/1.1 Apple-iPhone11C6/1905.258 - - dc.domain.com:444 200 0 0 600013 44.29.25.201,+10.140.11.12,+10.140.12.14,10.140.14.15`;
		const envelopedRawEvents = await Enveloper.addEnvelope(compressedRawEvents, "text/plain");

		const actualObject = JSON.parse(envelopedRawEvents);

		assert.ok(actualObject.recv_time);
		assert.ok(actualObject.uuid);

		assert.strictEqual(actualObject.recv_ipv4, "127.0.0.1");
		assert.strictEqual(actualObject.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.tag, "some_tag");
		assert.strictEqual(actualObject.mime, "text/plain");
		assert.strictEqual(actualObject.normalized, false);
		assert.strictEqual(actualObject.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.type, "raw");
	});

	test('Проверка xml', async () => {

		const xmlEvent = 
`<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
<System>
  <Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-a5ba-3e3b0328c30d}" />
  <EventID>4662</EventID>
  <Version>0</Version>
  <Level>0</Level>
  <Task>12804</Task>
  <Opcode>0</Opcode>
  <Keywords>0x8020000000000000</Keywords>
  <TimeCreated SystemTime="2021-01-23T15:16:51.5407675Z" />
  <EventRecordID>95430729</EventRecordID>
  <Correlation ActivityID="{7bf708e0-5d4b-1572-3109-f77b4b5dd901}" />
  <Execution ProcessID="720" ThreadID="33996" />
  <Channel>Security</Channel>
  <Computer>ivanov-pc.example.com</Computer>
  <Security />
</System>
<EventData>
  <Data Name="SubjectUserSid">S-1-5-18</Data>
  <Data Name="SubjectUserName">IVANOV-PC$</Data>
  <Data Name="SubjectDomainName">EXAMPLE</Data>
  <Data Name="SubjectLogonId">0x3e7</Data>
  <Data Name="ObjectServer">WMI</Data>
  <Data Name="ObjectType">WMI Namespace</Data>
  <Data Name="ObjectName">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
  <Data Name="OperationType">Object Access</Data>
  <Data Name="HandleId">0x0</Data>
  <Data Name="AccessList">%%1552
			  </Data>
  <Data Name="AccessMask">0x1</Data>
  <Data Name="Properties">-</Data>
  <Data Name="AdditionalInfo">Local Read (ConnectServer)</Data>
  <Data Name="AdditionalInfo2">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
</EventData>
</Event>`;

		assert.ok(Enveloper.isRawEventXml(xmlEvent));
	});

	test('Проверка текстого события', async () => {

		const xmlEvent = 
`2022-07-20 07:03:38 W3SVC2 mail-srv 10.0.25.16 POST /Microsoft-Server-ActiveSync/Proxy/default.eas User=user@domain.com&DeviceId=JUQGGDFCDD29R3H003TJA63E10&DeviceType=iPhone&Cmd=Ping&Log=SC1:1_PrxFrom:10.0.22.211_Ver1:161_HH:mail.domain.com_SmtpAdrs:User%domain.com_Hb:600_Rto:2_Cpo:656_Fet:600000_Mbx:mail.domain.com_Cafe:MBX-SRV.DOMAIN.COM_Dc:dc-srv.domain.com_Throttle:0_SBkOffD:L%2f-470_TmRcv:06:53:38.4480003_TmSt:06:53:38.4519947_TmFin:06:53:38.4519947_TmCmpl:07:03:38.440522_TmCnt:07:03:37.7834641_Budget:(A)Owner%3aS-1-5-21-1023191730-727829927-3110000192-14176%5FJUQGGDFCDD29R3H003TJA63E10%5FiPhone%2cConn%3a0%2cMaxConn%3a10%2cMaxBurst%3a480000%2cBalance%3a480000%2cCutoff%3a600000%2cRechargeRate%3a1800000%2cPolicy%3aGlobalThrottlingPolicy%5F5c9d3d31-7f05-4e14-b8f8-05780608b52f%2cIsServiceAccount%3aFalse%2cLiveTime%3a00%3a00%3a30.6952647%3b(D)Owner%3aS-1-5-21-1023191730-727829927-3110000192-14176%5FJUQGGDFCDD29R3H003TJA63E10%5FiPhone%2cConn%3a0%2cMaxConn%3a10%2cMaxBurst%3a480000%2cBalance%3a480000%2cCutoff%3a600000%2cRechargeRate%3a1800000%2cPolicy%3aGlobalThrottlingPolicy%5F5c9d3d31-7f05-4e14-b8f8-05780608b52f%2cIsServiceAccount%3aFalse%2cLiveTime%3a00%3a00%3a00.6580618_ActivityContextData:ActivityID%3d0483abd0-f1d6-44e7-bfe8-e951e242b7bd%3bI32%3aADS.C%5bdc-srv%5d%3d1%3bF%3aADS.AL%5bdc-srv%5d%3d1.62791%3bI32%3aATE.C%5bdc.domain.com%5d%3d1%3bF%3aATE.AL%5bdc.domain.com%5d%3d0%3bS%3aWLM.Bal%3d480000%3bS%3aWLM.BT%3dEas_ 444 DOMAIN\\USER 23.12.22.38 HTTP/1.1 Apple-iPhone11C6/1905.258 - - dc.domain.com:444 200 0 0 600013 44.29.25.201,+10.140.11.12,+10.140.12.14,10.140.14.15`;

		assert.ok(!Enveloper.isRawEventXml(xmlEvent));
	});

	
	test('Событие с важностью medium скопированное через Ctrl+C из SIEM', async () => {

		const compressedRawEvents = 
`"medium","{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"Microsoft-Windows-Security-Auditing","Guid":"{54849621-5478-4994-a5ba-3e3b0328c30d}"},"EventID":"4670","Version":"0","Level":"0","Task":"13570","Opcode":"0","Keywords":"0x8020000000000000","TimeCreated":{"SystemTime":"2021-01-11T18:46:27.9343688Z"},"EventRecordID":"86895453","Correlation":null,"Execution":{"ProcessID":"4","ThreadID":"16700"},"Channel":"Security","Computer":"user.company.com","Security":null},"EventData":{"Data":[{"text":"S-1-5-18","Name":"SubjectUserSid"},{"text":"USER-NB$","Name":"SubjectUserName"},{"text":"COMPANY","Name":"SubjectDomainName"},{"text":"0x3e7","Name":"SubjectLogonId"},{"text":"Security","Name":"ObjectServer"},{"text":"Token","Name":"ObjectType"},{"text":"-","Name":"ObjectName"},{"text":"0x2898","Name":"HandleId"},{"text":"D:(A;;GA;;;SY)(A;;GA;;;NS)","Name":"OldSd"},{"text":"D:(A;;GA;;;SY)(A;;RC;;;OW)(A;;GA;;;S-1-5-86-2412512-123-41241-21424-124124)","Name":"NewSd"},{"text":"0x12cc","Name":"ProcessId"},{"text":"C:\\Windows\\System32\\svchost.exe","Name":"ProcessName"}]}}}"`;

		const envelopedRawEvents = Enveloper.addEventsToEnvelope(compressedRawEvents, "application/x-pt-eventlog");

		const firstEventJson = JSON.parse(envelopedRawEvents[0]);
		assert.ok(firstEventJson.body);
		assert.ok(firstEventJson.recv_time);
		assert.ok(firstEventJson.uuid);
	});

	test('Два события скопированные через Ctrl+C из SIEM', async () => {

		const compressedRawEvents = 
`"","{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"Microsoft-Windows-Sysmon","Guid":"{5770385F-C22A-43E0-BF4C-06F5698FFBD9}"},"EventID":"1","Version":"5","Level":"4","Task":"1","Opcode":"0","Keywords":"0x8000000000000000","TimeCreated":{"SystemTime":"2022-10-03T15:00:14.787358500Z"},"EventRecordID":"836790","Correlation":null,"Execution":{"ProcessID":"9044","ThreadID":"6500"},"Channel":"Microsoft-Windows-Sysmon/Operational","Computer":"test_w10x64-155-without_updates.testlab.esc","Security":{"UserID":"S-1-5-18"}},"EventData":{"Data":[{"text":"-","Name":"RuleName"},{"text":"2022-10-03 15:00:14.745","Name":"UtcTime"},{"text":"{63310A87-F8FE-633A-3702-000000000500}","Name":"ProcessGuid"},{"text":"676","Name":"ProcessId"},{"text":"C:\\Windows\\System32\\msiexec.exe","Name":"Image"},{"text":"5.0.16299.611 (WinBuild.160101.0800)","Name":"FileVersion"},{"text":"Windows® installer","Name":"Description"},{"text":"Windows Installer - Unicode","Name":"Product"},{"text":"Microsoft Corporation","Name":"Company"},{"text":"msiexec.exe","Name":"OriginalFileName"},{"text":"C:\\Windows\\system32\\msiexec.exe /V","Name":"CommandLine"},{"text":"C:\\Windows\\system32\\","Name":"CurrentDirectory"},{"text":"NT AUTHORITY\\SYSTEM","Name":"User"},{"text":"{63310A87-F5C6-633A-E703-000000000000}","Name":"LogonGuid"},{"text":"0x3e7","Name":"LogonId"},{"text":"0","Name":"TerminalSessionId"},{"text":"System","Name":"IntegrityLevel"},{"text":"MD5=E1ED698D30BDEC92923A313AE0006E67,SHA256=F64A1393B51C091B25931FF98873CCDD8BA6614FECC99D425ECF153346491CA9,IMPHASH=1E823223C3531F1CAFD735C7958DCAAC","Name":"Hashes"},{"text":"{63310A87-F5C6-633A-0A00-000000000500}","Name":"ParentProcessGuid"},{"text":"664","Name":"ParentProcessId"},{"text":"C:\\Windows\\System32\\services.exe","Name":"ParentImage"},{"text":"C:\\Windows\\system32\\services.exe","Name":"ParentCommandLine"},{"text":"NT AUTHORITY\\SYSTEM","Name":"ParentUser"}]}}}"
"","{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"Microsoft-Windows-Sysmon","Guid":"{5770385F-C22A-43E0-BF4C-06F5698FFBD9}"},"EventID":"1","Version":"5","Level":"4","Task":"1","Opcode":"0","Keywords":"0x8000000000000000","TimeCreated":{"SystemTime":"2022-10-03T15:00:14.787358500Z"},"EventRecordID":"836790","Correlation":null,"Execution":{"ProcessID":"9044","ThreadID":"6500"},"Channel":"Microsoft-Windows-Sysmon/Operational","Computer":"test_w10x64-155-without_updates.testlab.esc","Security":{"UserID":"S-1-5-18"}},"EventData":{"Data":[{"text":"-","Name":"RuleName"},{"text":"2022-10-03 15:00:14.745","Name":"UtcTime"},{"text":"{63310A87-F8FE-633A-3702-000000000500}","Name":"ProcessGuid"},{"text":"676","Name":"ProcessId"},{"text":"C:\\Windows\\System32\\msiexec.exe","Name":"Image"},{"text":"5.0.16299.611 (WinBuild.160101.0800)","Name":"FileVersion"},{"text":"Windows® installer","Name":"Description"},{"text":"Windows Installer - Unicode","Name":"Product"},{"text":"Microsoft Corporation","Name":"Company"},{"text":"msiexec.exe","Name":"OriginalFileName"},{"text":"C:\\Windows\\system32\\msiexec.exe /V","Name":"CommandLine"},{"text":"C:\\Windows\\system32\\","Name":"CurrentDirectory"},{"text":"NT AUTHORITY\\SYSTEM","Name":"User"},{"text":"{63310A87-F5C6-633A-E703-000000000000}","Name":"LogonGuid"},{"text":"0x3e7","Name":"LogonId"},{"text":"0","Name":"TerminalSessionId"},{"text":"System","Name":"IntegrityLevel"},{"text":"MD5=E1ED698D30BDEC92923A313AE0006E67,SHA256=F64A1393B51C091B25931FF98873CCDD8BA6614FECC99D425ECF153346491CA9,IMPHASH=1E823223C3531F1CAFD735C7958DCAAC","Name":"Hashes"},{"text":"{63310A87-F5C6-633A-0A00-000000000500}","Name":"ParentProcessGuid"},{"text":"664","Name":"ParentProcessId"},{"text":"C:\\Windows\\System32\\services.exe","Name":"ParentImage"},{"text":"C:\\Windows\\system32\\services.exe","Name":"ParentCommandLine"},{"text":"NT AUTHORITY\\SYSTEM","Name":"ParentUser"}]}}}"`;
		
				const envelopedRawEvents = Enveloper.addEventsToEnvelope(compressedRawEvents, "application/x-pt-eventlog");
				assert.ok(envelopedRawEvents.length == 2);

				const firstEventJson = JSON.parse(envelopedRawEvents[0]);
				assert.strictEqual(firstEventJson.body, "{\"Event\":{\"xmlns\":\"http://schemas.microsoft.com/win/2004/08/events/event\",\"System\":{\"Provider\":{\"Name\":\"Microsoft-Windows-Sysmon\",\"Guid\":\"{5770385F-C22A-43E0-BF4C-06F5698FFBD9}\"},\"EventID\":\"1\",\"Version\":\"5\",\"Level\":\"4\",\"Task\":\"1\",\"Opcode\":\"0\",\"Keywords\":\"0x8000000000000000\",\"TimeCreated\":{\"SystemTime\":\"2022-10-03T15:00:14.787358500Z\"},\"EventRecordID\":\"836790\",\"Correlation\":null,\"Execution\":{\"ProcessID\":\"9044\",\"ThreadID\":\"6500\"},\"Channel\":\"Microsoft-Windows-Sysmon/Operational\",\"Computer\":\"test_w10x64-155-without_updates.testlab.esc\",\"Security\":{\"UserID\":\"S-1-5-18\"}},\"EventData\":{\"Data\":[{\"text\":\"-\",\"Name\":\"RuleName\"},{\"text\":\"2022-10-03 15:00:14.745\",\"Name\":\"UtcTime\"},{\"text\":\"{63310A87-F8FE-633A-3702-000000000500}\",\"Name\":\"ProcessGuid\"},{\"text\":\"676\",\"Name\":\"ProcessId\"},{\"text\":\"C:\\Windows\\System32\\msiexec.exe\",\"Name\":\"Image\"},{\"text\":\"5.0.16299.611 (WinBuild.160101.0800)\",\"Name\":\"FileVersion\"},{\"text\":\"Windows® installer\",\"Name\":\"Description\"},{\"text\":\"Windows Installer - Unicode\",\"Name\":\"Product\"},{\"text\":\"Microsoft Corporation\",\"Name\":\"Company\"},{\"text\":\"msiexec.exe\",\"Name\":\"OriginalFileName\"},{\"text\":\"C:\\Windows\\system32\\msiexec.exe /V\",\"Name\":\"CommandLine\"},{\"text\":\"C:\\Windows\\system32\\\",\"Name\":\"CurrentDirectory\"},{\"text\":\"NT AUTHORITY\\SYSTEM\",\"Name\":\"User\"},{\"text\":\"{63310A87-F5C6-633A-E703-000000000000}\",\"Name\":\"LogonGuid\"},{\"text\":\"0x3e7\",\"Name\":\"LogonId\"},{\"text\":\"0\",\"Name\":\"TerminalSessionId\"},{\"text\":\"System\",\"Name\":\"IntegrityLevel\"},{\"text\":\"MD5=E1ED698D30BDEC92923A313AE0006E67,SHA256=F64A1393B51C091B25931FF98873CCDD8BA6614FECC99D425ECF153346491CA9,IMPHASH=1E823223C3531F1CAFD735C7958DCAAC\",\"Name\":\"Hashes\"},{\"text\":\"{63310A87-F5C6-633A-0A00-000000000500}\",\"Name\":\"ParentProcessGuid\"},{\"text\":\"664\",\"Name\":\"ParentProcessId\"},{\"text\":\"C:\\Windows\\System32\\services.exe\",\"Name\":\"ParentImage\"},{\"text\":\"C:\\Windows\\system32\\services.exe\",\"Name\":\"ParentCommandLine\"},{\"text\":\"NT AUTHORITY\\SYSTEM\",\"Name\":\"ParentUser\"}]}}}");
				assert.ok(firstEventJson.recv_time);
				assert.ok(firstEventJson.uuid);
		
				assert.strictEqual(firstEventJson.recv_ipv4, "127.0.0.1");
				assert.strictEqual(firstEventJson.task_id, "00000000-0000-0000-0000-000000000000");
				assert.strictEqual(firstEventJson.tag, "some_tag");
				assert.strictEqual(firstEventJson.mime, "application/x-pt-eventlog");
				assert.strictEqual(firstEventJson.normalized, false);
				assert.strictEqual(firstEventJson.input_id, "00000000-0000-0000-0000-000000000000");
				assert.strictEqual(firstEventJson.type, "raw");

				const secondEventJson = JSON.parse(envelopedRawEvents[1]);
				assert.ok(secondEventJson.recv_time);
				assert.ok(secondEventJson.uuid);
		
				assert.strictEqual(secondEventJson.recv_ipv4, "127.0.0.1");
				assert.strictEqual(secondEventJson.task_id, "00000000-0000-0000-0000-000000000000");
				assert.strictEqual(secondEventJson.tag, "some_tag");
				assert.strictEqual(secondEventJson.mime, "application/x-pt-eventlog");
				assert.strictEqual(secondEventJson.normalized, false);
				assert.strictEqual(secondEventJson.input_id, "00000000-0000-0000-0000-000000000000");
				assert.strictEqual(secondEventJson.type, "raw");
			});

	test('Одно событие скопированое через Ctrl+C из SIEM', async () => {

		const compressedRawEvents = 
`"","{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"Microsoft-Windows-Sysmon","Guid":"{5770385F-C22A-43E0-BF4C-06F5698FFBD9}"},"EventID":"1","Version":"5","Level":"4","Task":"1","Opcode":"0","Keywords":"0x8000000000000000","TimeCreated":{"SystemTime":"2022-10-03T15:00:14.787358500Z"},"EventRecordID":"836790","Correlation":null,"Execution":{"ProcessID":"9044","ThreadID":"6500"},"Channel":"Microsoft-Windows-Sysmon/Operational","Computer":"test_w10x64-155-without_updates.testlab.esc","Security":{"UserID":"S-1-5-18"}},"EventData":{"Data":[{"text":"-","Name":"RuleName"},{"text":"2022-10-03 15:00:14.745","Name":"UtcTime"},{"text":"{63310A87-F8FE-633A-3702-000000000500}","Name":"ProcessGuid"},{"text":"676","Name":"ProcessId"},{"text":"C:\\Windows\\System32\\msiexec.exe","Name":"Image"},{"text":"5.0.16299.611 (WinBuild.160101.0800)","Name":"FileVersion"},{"text":"Windows® installer","Name":"Description"},{"text":"Windows Installer - Unicode","Name":"Product"},{"text":"Microsoft Corporation","Name":"Company"},{"text":"msiexec.exe","Name":"OriginalFileName"},{"text":"C:\\Windows\\system32\\msiexec.exe /V","Name":"CommandLine"},{"text":"C:\\Windows\\system32\\","Name":"CurrentDirectory"},{"text":"NT AUTHORITY\\SYSTEM","Name":"User"},{"text":"{63310A87-F5C6-633A-E703-000000000000}","Name":"LogonGuid"},{"text":"0x3e7","Name":"LogonId"},{"text":"0","Name":"TerminalSessionId"},{"text":"System","Name":"IntegrityLevel"},{"text":"MD5=E1ED698D30BDEC92923A313AE0006E67,SHA256=F64A1393B51C091B25931FF98873CCDD8BA6614FECC99D425ECF153346491CA9,IMPHASH=1E823223C3531F1CAFD735C7958DCAAC","Name":"Hashes"},{"text":"{63310A87-F5C6-633A-0A00-000000000500}","Name":"ParentProcessGuid"},{"text":"664","Name":"ParentProcessId"},{"text":"C:\\Windows\\System32\\services.exe","Name":"ParentImage"},{"text":"C:\\Windows\\system32\\services.exe","Name":"ParentCommandLine"},{"text":"NT AUTHORITY\\SYSTEM","Name":"ParentUser"}]}}}"`;
		
				const envelopedRawEvents = Enveloper.addEventsToEnvelope(compressedRawEvents, "application/x-pt-eventlog");
				assert.ok(envelopedRawEvents.length == 1);

				const actualObject = JSON.parse(envelopedRawEvents[0]);
				assert.ok(actualObject.recv_time);
				assert.ok(actualObject.uuid);
		
				assert.strictEqual(actualObject.recv_ipv4, "127.0.0.1");
				assert.strictEqual(actualObject.task_id, "00000000-0000-0000-0000-000000000000");
				assert.strictEqual(actualObject.tag, "some_tag");
				assert.strictEqual(actualObject.mime, "application/x-pt-eventlog");
				assert.strictEqual(actualObject.normalized, false);
				assert.strictEqual(actualObject.input_id, "00000000-0000-0000-0000-000000000000");
				assert.strictEqual(actualObject.type, "raw");
			});




	test('Одно событие с \\r и \\n без экрана в теле события.', async () => {

const compressedRawEvents = 
`{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"Microsoft-Windows-PowerShell","Guid":"{a0c1853b-5c40-4b15-8766-3cf1c58f985a}"},"EventID":"4104","Version":"1","Level":"5","Task":"2","Opcode":"15","Keywords":"0x0","TimeCreated":{"SystemTime":"2022-07-07T09:13:49.9161942Z"},"EventRecordID":"814872","Correlation":{"ActivityID":"{60e8c5c4-7b3c-0002-3a8e-2d613c7bd801}"},"Execution":{"ProcessID":"25420","ThreadID":"13636"},"Channel":"Microsoft-Windows-PowerShell/Operational","Computer":"Test_w10x64-132.testlab.esc","Security":{"UserID":"S-1-5-21-1129291328-2819992169-918366777-1113"}},"EventData":{"Data":[{"text":"1","Name":"MessageNumber"},{"text":"1","Name":"MessageTotal"},{"text":"(‘6e,6f,74,65,70,61,64'.SPLiT(‘,’) |fOREAch {( [cHar]([COnVERt]::tOINt16(([STRINg]$_ ) ,16 ))) })-jOIn ''","Name":"ScriptBlockText"},{"text":"627f927a-2f62-4ce7-b988-966fa1030ec6","Name":"ScriptBlockId"},{"Name":"Path"}]},"RenderingInfo":{"Culture":"en-US","Message":"Creating Scriptblock text (1 of 1):\\r\\n(‘6e,6f,74,65,70,61,64'.SPLiT(‘,’) |fOREAch {( [cHar]([COnVERt]::tOINt16(([STRINg]$_ ) ,16 ))) })-jOIn ''\\r\\n\\r\\nScriptBlock ID: 627f927a-2f62-4ce7-b988-966fa1030ec6\\r\\nPath: ","Level":"Verbose","Task":"Execute a Remote Command","Opcode":"On create calls","Channel":"Microsoft-Windows-PowerShell/Operational","Provider":null,"Keywords":null}}}`;

		const envelopedRawEvents = Enveloper.addEventsToEnvelope(compressedRawEvents, "application/x-pt-eventlog");
		assert.ok(envelopedRawEvents.length == 1);

		const actualObject = JSON.parse(envelopedRawEvents[0]);

		assert.strictEqual(actualObject.body, "{\"Event\":{\"xmlns\":\"http://schemas.microsoft.com/win/2004/08/events/event\",\"System\":{\"Provider\":{\"Name\":\"Microsoft-Windows-PowerShell\",\"Guid\":\"{a0c1853b-5c40-4b15-8766-3cf1c58f985a}\"},\"EventID\":\"4104\",\"Version\":\"1\",\"Level\":\"5\",\"Task\":\"2\",\"Opcode\":\"15\",\"Keywords\":\"0x0\",\"TimeCreated\":{\"SystemTime\":\"2022-07-07T09:13:49.9161942Z\"},\"EventRecordID\":\"814872\",\"Correlation\":{\"ActivityID\":\"{60e8c5c4-7b3c-0002-3a8e-2d613c7bd801}\"},\"Execution\":{\"ProcessID\":\"25420\",\"ThreadID\":\"13636\"},\"Channel\":\"Microsoft-Windows-PowerShell/Operational\",\"Computer\":\"Test_w10x64-132.testlab.esc\",\"Security\":{\"UserID\":\"S-1-5-21-1129291328-2819992169-918366777-1113\"}},\"EventData\":{\"Data\":[{\"text\":\"1\",\"Name\":\"MessageNumber\"},{\"text\":\"1\",\"Name\":\"MessageTotal\"},{\"text\":\"(‘6e,6f,74,65,70,61,64'.SPLiT(‘,’) |fOREAch {( [cHar]([COnVERt]::tOINt16(([STRINg]$_ ) ,16 ))) })-jOIn ''\",\"Name\":\"ScriptBlockText\"},{\"text\":\"627f927a-2f62-4ce7-b988-966fa1030ec6\",\"Name\":\"ScriptBlockId\"},{\"Name\":\"Path\"}]},\"RenderingInfo\":{\"Culture\":\"en-US\",\"Message\":\"Creating Scriptblock text (1 of 1):\\r\\n(‘6e,6f,74,65,70,61,64'.SPLiT(‘,’) |fOREAch {( [cHar]([COnVERt]::tOINt16(([STRINg]$_ ) ,16 ))) })-jOIn ''\\r\\n\\r\\nScriptBlock ID: 627f927a-2f62-4ce7-b988-966fa1030ec6\\r\\nPath: \",\"Level\":\"Verbose\",\"Task\":\"Execute a Remote Command\",\"Opcode\":\"On create calls\",\"Channel\":\"Microsoft-Windows-PowerShell/Operational\",\"Provider\":null,\"Keywords\":null}}}");
		assert.ok(actualObject.recv_time);
		assert.ok(actualObject.uuid);

		assert.strictEqual(actualObject.recv_ipv4, "127.0.0.1");
		assert.strictEqual(actualObject.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.tag, "some_tag");
		assert.strictEqual(actualObject.mime, "application/x-pt-eventlog");
		assert.strictEqual(actualObject.normalized, false);
		assert.strictEqual(actualObject.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.type, "raw");
	});


	test('Добавление одного события в конверт и символами новых строк в конце', async () => {

const rawEvents = 
`{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"MSSQLSERVER"},"EventID":{"text":"18453","Qualifiers":"16384"},"Level":"0","Task":"4","Keywords":"0xa0000000000000","TimeCreated":{"SystemTime":"2022-06-24T15:50:01.779402300Z"},"EventRecordID":"6490211","Channel":"Application","Computer":"dc.domain.com","Security":{"UserID":"S-1-5-21-1023000730-721111127-3110000192-11233"}},"EventData":{"Data":["DOMAIN\\Svc"," [CLIENT: 11.11.11.11]"],"Binary":"436127235725400025130510230612034601230460103460713047013047010234070123"}}}


`;
		const envelopedRawEvents = Enveloper.addEventsToEnvelope(rawEvents, "application/x-pt-eventlog");
		const actualObject = JSON.parse(envelopedRawEvents[0]);

		assert.ok(envelopedRawEvents.length == 1);

		assert.ok(actualObject.recv_time);
		assert.ok(actualObject.uuid);

		assert.strictEqual(actualObject.recv_ipv4, "127.0.0.1");
		assert.strictEqual(actualObject.task_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.tag, "some_tag");
		assert.strictEqual(actualObject.mime, "application/x-pt-eventlog");
		assert.strictEqual(actualObject.normalized, false);
		assert.strictEqual(actualObject.input_id, "00000000-0000-0000-0000-000000000000");
		assert.strictEqual(actualObject.type, "raw");
	});

	test('Проверка, добавлен ли был уже конверт на три события в конверте.', async () => {

		const rawEvent = 
`
{"body":"{\\"Event\\":{\\"xmlns\\":\\"http://schemas.microsoft.com/win/2004/08/events/event\\",\\"System\\":{\\"Provider\\":{\\"Name\\":\\"MSSQLSERVER\\"},\\"EventID\\":{\\"text\\":\\"18453\\",\\"Qualifiers\\":\\"16384\\"},\\"Level\\":\\"0\\",\\"Task\\":\\"4\\",\\"Keywords\\":\\"0xa0000000000000\\",\\"TimeCreated\\":{\\"SystemTime\\":\\"2022-03-03T12:46:22.146483700Z\\"},\\"EventRecordID\\":\\"4243023\\",\\"Channel\\":\\"Application\\",\\"Computer\\":\\"dc.domain.com\\",\\"Security\\":{\\"UserID\\":\\"S-1-5-21-1023000730-721111127-3110000192-11233\\"}},\\"EventData\\":{\\"Data\\":[\\"domain\\\\Svc-1C\\",\\" [CLIENT: 192.168.1.2]\\"],\\"Binary\\":\\"436127235725400025130510230612034601230460103460713047013047010234070123\\"}}}","recv_ipv4":"127.0.0.1","recv_time":"2022-02-24T13:38:05Z","task_id":"00000000-0000-0000-0000-000000000000","mime":"application/x-pt-eventlog","normalized":false,"input_id":"00000000-0000-0000-0000-000000000000","type":"raw","uuid":"0f6ca38d-99af-42b4-8c9d-accd5614c484"}
`;
		const result = Enveloper.isEnvelopedEvents(rawEvent);
		assert.ok(result);
	});

	test('Проверка, добавлен ли был уже конверт на три сырых события.', async () => {

		const rawEvent = 
`
{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"MSSQLSERVER"},"EventID":{"text":"18453","Qualifiers":"16384"},"Level":"0","Task":"4","Keywords":"0xa0000000000000","TimeCreated":{"SystemTime":"2022-06-24T15:50:01.779402300Z"},"EventRecordID":"6490211","Channel":"Application","Computer":"dc.domain.com","Security":{"UserID":"S-1-5-21-1023000730-721111127-3110000192-11233"}},"EventData":{"Data":["domain\\\\Svc-1C"," [CLIENT: 192.168.1.1]"],"Binary":"436127235725400025130510230612034601230460103460713047013047010234070123"}}}
{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"MSSQLSERVER"},"EventID":{"text":"18453","Qualifiers":"16384"},"Level":"0","Task":"4","Keywords":"0xa0000000000000","TimeCreated":{"SystemTime":"2022-06-24T15:50:01.779402300Z"},"EventRecordID":"6490211","Channel":"Application","Computer":"dc.domain.com","Security":{"UserID":"S-1-5-21-1023000730-721111127-3110000192-11233"}},"EventData":{"Data":["domain\\\\Svc-1C"," [CLIENT: 192.168.1.1]"],"Binary":"436127235725400025130510230612034601230460103460713047013047010234070123"}}}
{"Event":{"xmlns":"http://schemas.microsoft.com/win/2004/08/events/event","System":{"Provider":{"Name":"MSSQLSERVER"},"EventID":{"text":"18453","Qualifiers":"16384"},"Level":"0","Task":"4","Keywords":"0xa0000000000000","TimeCreated":{"SystemTime":"2022-06-24T15:50:01.779402300Z"},"EventRecordID":"6490211","Channel":"Application","Computer":"dc.domain.com","Security":{"UserID":"S-1-5-21-1023000730-721111127-3110000192-11233"}},"EventData":{"Data":["domain\\\\Svc-1C"," [CLIENT: 192.168.1.1]"],"Binary":"436127235725400025130510230612034601230460103460713047013047010234070123"}}}
`;
		const result = Enveloper.isEnvelopedEvents(rawEvent);
		assert.ok(!result);
	});

	test('Проверка, добавлен ли был уже конверт на одно сырое событие.', async () => {

		const rawEvent = "{\"Event\":{\"xmlns\":\"http://schemas.microsoft.com/win/2004/08/events/event\",\"System\":{\"Provider\":{\"Name\":\"MSSQLSERVER\"},\"EventID\":{\"text\":\"18453\",\"Qualifiers\":\"16384\"},\"Level\":\"0\",\"Task\":\"4\",\"Keywords\":\"0xa0000000000000\",\"TimeCreated\":{\"SystemTime\":\"2022-06-24T15:50:01.779402300Z\"},\"EventRecordID\":\"6490211\",\"Channel\":\"Application\",\"Computer\":\"dc.domain.com\",\"Security\":{\"UserID\":\"S-1-5-21-1023000730-721111127-3110000192-11233\"}},\"EventData\":{\"Data\":[\"domain\\\\Svc-1C\",\" [CLIENT: 192.168.1.1]\"],\"Binary\":\"436127235725400025130510230612034601230460103460713047013047010234070123\"}}}";
		const result = Enveloper.isEnvelopedEvents(rawEvent);
		assert.ok(!result);
	});

	test('Одно событие с корректным xml', async () => {

		const xmlEvent = 
`<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
<System>
  <Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-a5ba-3e3b0328c30d}" />
  <EventID>4662</EventID>
  <Version>0</Version>
  <Level>0</Level>
  <Task>12804</Task>
  <Opcode>0</Opcode>
  <Keywords>0x8020000000000000</Keywords>
  <TimeCreated SystemTime="2021-01-23T15:16:51.5407675Z" />
  <EventRecordID>95430729</EventRecordID>
  <Correlation ActivityID="{7bf708e0-5d4b-1572-3109-f77b4b5dd901}" />
  <Execution ProcessID="720" ThreadID="33996" />
  <Channel>Security</Channel>
  <Computer>ivanov-pc.example.com</Computer>
  <Security />
</System>
<EventData>
  <Data Name="SubjectUserSid">S-1-5-18</Data>
  <Data Name="SubjectUserName">IVANOV-PC$</Data>
  <Data Name="SubjectDomainName">EXAMPLE</Data>
  <Data Name="SubjectLogonId">0x3e7</Data>
  <Data Name="ObjectServer">WMI</Data>
  <Data Name="ObjectType">WMI Namespace</Data>
  <Data Name="ObjectName">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
  <Data Name="OperationType">Object Access</Data>
  <Data Name="HandleId">0x0</Data>
  <Data Name="AccessList">%%1552
			  </Data>
  <Data Name="AccessMask">0x1</Data>
  <Data Name="Properties">-</Data>
  <Data Name="AdditionalInfo">Local Read (ConnectServer)</Data>
  <Data Name="AdditionalInfo2">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
</EventData>
</Event>`;

		const jsonEvent = Enveloper.convertXmlRawEventToJsonObject(xmlEvent);

		assert.ok(jsonEvent);
		assert.ok(jsonEvent.Event);
		assert.ok(jsonEvent.Event.System);

		assert.strictEqual(jsonEvent.Event.System.EventID, "4662");

		assert.ok(jsonEvent.Event.EventData);

		assert.strictEqual(jsonEvent.Event.EventData.Data[0].Name, "SubjectUserSid");
		assert.strictEqual(jsonEvent.Event.EventData.Data[0].text, "S-1-5-18");

		assert.strictEqual(jsonEvent.Event.EventData.Data[13].Name, "AdditionalInfo2");
		assert.strictEqual(jsonEvent.Event.EventData.Data[13].text, "root\\cimv2\\Security\\MicrosoftVolumeEncryption");
	});	
	
	test('Одно событие с xml с артефактами в виде минусов, которые появляются при копировании из EventViewer', async () => {

		const xmlEvent = 
`- <Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
- <System>
  <Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-a5ba-3e3b0328c30d}" />
  <EventID>4662</EventID>
  <Version>0</Version>
  <Level>0</Level>
  <Task>12804</Task>
  <Opcode>0</Opcode>
  <Keywords>0x8020000000000000</Keywords>
  <TimeCreated SystemTime="2021-01-23T15:16:51.5407675Z" />
  <EventRecordID>95430729</EventRecordID>
  <Correlation ActivityID="{7bf708e0-5d4b-1572-3109-f77b4b5dd901}" />
  <Execution ProcessID="720" ThreadID="33996" />
  <Channel>Security</Channel>
  <Computer>ivanov-pc.example.com</Computer>
  <Security />
</System>
- <EventData>
  <Data Name="SubjectUserSid">S-1-5-18</Data>
  <Data Name="SubjectUserName">IVANOV-PC$</Data>
  <Data Name="SubjectDomainName">EXAMPLE</Data>
  <Data Name="SubjectLogonId">0x3e7</Data>
  <Data Name="ObjectServer">WMI</Data>
  <Data Name="ObjectType">WMI Namespace</Data>
  <Data Name="ObjectName">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
  <Data Name="OperationType">Object Access</Data>
  <Data Name="HandleId">0x0</Data>
  <Data Name="AccessList">%%1552
			  </Data>
  <Data Name="AccessMask">0x1</Data>
  <Data Name="Properties">-</Data>
  <Data Name="AdditionalInfo">Local Read (ConnectServer)</Data>
  <Data Name="AdditionalInfo2">root\\cimv2\\Security\\MicrosoftVolumeEncryption</Data>
</EventData>
</Event>`;

		const jsonEvent = Enveloper.convertXmlRawEventToJsonObject(xmlEvent);

		assert.ok(jsonEvent);
		assert.ok(jsonEvent.Event);
		assert.ok(jsonEvent.Event.System);

		assert.strictEqual(jsonEvent.Event.System.EventID, "4662");

		assert.ok(jsonEvent.Event.EventData);

		assert.strictEqual(jsonEvent.Event.EventData.Data[0].Name, "SubjectUserSid");
		assert.strictEqual(jsonEvent.Event.EventData.Data[0].text, "S-1-5-18");

		assert.strictEqual(jsonEvent.Event.EventData.Data[13].Name, "AdditionalInfo2");
		assert.strictEqual(jsonEvent.Event.EventData.Data[13].text, "root\\cimv2\\Security\\MicrosoftVolumeEncryption");
	});
});