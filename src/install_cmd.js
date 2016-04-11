import {_do} from 'rxjs/operator/do'
import {skip} from 'rxjs/operator/skip'
import {merge} from 'rxjs/operator/merge'
import {filter} from 'rxjs/operator/filter'
import {concat} from 'rxjs/operator/concat'
import {publishReplay} from 'rxjs/operator/publishReplay'
import * as entryDep from './entry_dep'
import {resolveAll, fetchAll, linkAll, buildAll} from './install'

function logResolved ({pkgJSON: {name, version}}) {
  console.log(`resolved ${name}@${version}`)
}

/**
 * run the installation command.
 * @param  {String} cwd - current working directory (absolute path).
 * @param  {Object} argv - parsed command line arguments.
 * @return {Observable} - an observable sequence that will be completed once
 * the installation is complete.
 */
export default function installCmd (cwd, argv) {
  const explicit = !!(argv._.length - 1)
  const updatedPkgJSONs = explicit
    ? entryDep.fromArgv(cwd, argv)
    : entryDep.fromFS(cwd)

  const resolved = updatedPkgJSONs::resolveAll(cwd)::skip(1)
    ::filter(({ local }) => !local)
    ::_do(logResolved)
    ::publishReplay().refCount()

  const linked = resolved::linkAll()
  const fetched = resolved::fetchAll()
  const built = resolved::buildAll()

  return linked::merge(fetched)::concat(built)
}
