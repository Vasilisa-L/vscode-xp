import * as vscode from 'vscode';
import * as fs from 'fs';
import * as child_process from 'child_process';
import { XpException } from '../models/xpException';
import { integer } from 'vscode-languageclient';

export interface ProcessStatus {
	output: string;
	exitCode: integer;
	isInterrapted : boolean
}

export class ProcessHelper {
	public static readProcessPathArgsOutputSync(command: string, args: string[], encoding: BufferEncoding) : string {
		const childProcess = child_process.spawnSync(
			command,
			args, {
				shell: true,
				cwd: process.cwd(),
				env: process.env,
				stdio: 'pipe',
				encoding
			}
		);

		if(childProcess.status != 0) {
			throw new Error(`Ошибка запуска внешнего процесса '${command}'. ` + childProcess.stderr);
		}

		return childProcess.stdout;
	}

	/**
	 * Позволяет собрать сложную команду в виде запускаемого модуля и списка параметров *без экранирования*
	 * @param command базовая команда для запуска процесса
	 * @param args список параметров, которые не надо экранировать
	 * @param encoding кодировка вывода от команды
	 * @returns строковый вывод запускаемого процесса
	 */
	public static readProcessArgsOutputSync(command: string, args: string[], encoding: BufferEncoding) : string {
		const argsString = command + " " + args.join(" ");
		const childProcess = child_process.spawnSync(
			argsString,
			{
				shell: true,
				cwd: process.cwd(),
				env: process.env,
				stdio: 'pipe',
				encoding
			}
		);

		if(childProcess.status != 0) {
			return childProcess.stdout;
		}

		return childProcess.stdout;
	}
	
	public static executeWithArgsWithRealtimeOutput(
		command : string,
		params : string[],
		outputChannel : vscode.OutputChannel,
		token?: vscode.CancellationToken) : Promise<ProcessStatus> {

		return new Promise(function(resolve, reject) {
			let child: child_process.ChildProcessWithoutNullStreams; 
			try {
				child = child_process.spawn(command, params);
			} 
			catch(error) {
				reject(error);
				return;
			}

			token.onCancellationRequested( (e) => {
				child.kill();
				resolve({
					exitCode: child.exitCode,
					isInterrapted : true,
					output : output
				});
			});
		
			let output = "";
			child.stdout.setEncoding(ProcessHelper.outputEncoding);
			child.stdout.on('data', function(data) {
				output += data.toString();
				outputChannel.append(data.toString());
			});

			child.stdout.setEncoding(ProcessHelper.outputEncoding);
			child.stdout.on("error", function(data) {
				outputChannel.append(data.toString());
				output += data.toString();
			});
		
			child.stderr.setEncoding(ProcessHelper.outputEncoding);
			child.stderr.on('data', function(data) {
				outputChannel.append(data.toString());
				output += data.toString();
			});
		
			child.on('close', function(code) {
				resolve({
					exitCode: child.exitCode,
					isInterrapted : false,
					output : output
				});
			});
		});
	}

	public static executeWithArgsWithRealtimeEmmiterOutput(command : string, params : string[], emmiter : vscode.EventEmitter<string>) : Promise<string> {

		return new Promise(function(resolve, reject) {
			
			// Записываем в лог выполнения строку запуска
			emmiter.fire(`\n\nXP :: Run command: ${command} ${params.join(' ')}\n`);

			let child: child_process.ChildProcessWithoutNullStreams; 
			try {
				child = child_process.spawn(command, params);
			} 
			catch(error) {
				reject(error);
				return;
			}
		
			let output = "";
		
			child.stdout.setEncoding('utf8');
			child.stdout.on('data', function(data) {
				output += data.toString();
				emmiter.fire(data.toString());
			});

			child.stdout.setEncoding('utf8');
			child.stdout.on("error", function(data) {
				emmiter.fire(data.toString());
				output += data.toString();
			});
		
			child.stderr.setEncoding('utf8');
			child.stderr.on('data', function(data) {
				emmiter.fire(data.toString());
				output += data.toString();
			});
		
			child.on('close', function(code) {
				resolve(output);
			});
		});
	}
		
	public static readProcessOutputSync(command: string,encoding: BufferEncoding) : string {
		const childProcess = child_process.spawnSync(
			command,
			{
				shell: true,
				cwd: process.cwd(),
				env: process.env,
				stdio: 'pipe',
				encoding
			}
		);

		if(childProcess.status != 0) {
			throw new Error(`Ошибка запуска внешнего процесса '${command}'. ` + childProcess.stderr);
		}

		return childProcess.stdout;
	}

	public static outputEncoding : BufferEncoding = 'utf8';
}
